import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Borrow } from "../../models/borrow.model";
import { Book } from "../../models/book.model";
import { Fine } from "../../models/fine.model";
import { User } from "../../models/user.model";
import { createBorrowSchema, borrowQuerySchema } from "../../schemas/borrow.schema";
import { AppError, NotFoundError } from "../../shared/errors";
import { FINE_RATE_PER_DAY, MAX_BORROW_BOOKS, MAX_BORROW_DAYS } from "../../shared/constants";
import { reservationQueue, notificationQueue } from "../../workers/queues";

const borrowRoutes = new Hono();

borrowRoutes.post("/", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = createBorrowSchema.parse(body);

  const now = new Date();
  const maxDue = new Date(now);
  maxDue.setDate(maxDue.getDate() + MAX_BORROW_DAYS);
  if (input.dueDate > maxDue) {
    throw new AppError(`Due date cannot exceed ${MAX_BORROW_DAYS} days from today`, 400);
  }

  const activeCount = await Borrow.countDocuments({ user: userId, status: "active" });
  if (activeCount >= MAX_BORROW_BOOKS) {
    throw new AppError(`You can only borrow up to ${MAX_BORROW_BOOKS} books at a time`, 400);
  }

  const overdueCount = await Borrow.countDocuments({ user: userId, status: "overdue" });
  if (overdueCount > 0) {
    throw new AppError("You have overdue books. Please return them before borrowing more.", 400);
  }

  const book = await Book.findOneAndUpdate(
    { _id: input.book, availableCopies: { $gte: input.quantity } },
    { $inc: { availableCopies: -input.quantity } },
    { new: true },
  );
  if (!book) throw new AppError("Not enough copies available", 400);

  book.available = book.availableCopies > 0;
  await book.save();

  const borrow = await Borrow.create({
    user: userId,
    book: input.book,
    quantity: input.quantity,
    dueDate: input.dueDate,
  });

  return c.json({ success: true, message: "Book borrowed successfully", data: borrow }, 201);
});

borrowRoutes.put("/:id/return", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const borrow = await Borrow.findById(c.req.param("id"));
  if (!borrow) throw new NotFoundError("Borrow record not found");
  if (borrow.user.toString() !== userId && c.get("userRole") !== "admin") {
    throw new AppError("Unauthorized", 403);
  }

  borrow.returnedAt = new Date();
  borrow.status = "returned";
  await borrow.save();

  const book = await Book.findById(borrow.book);
  if (!book) {
    return c.json({ success: true, message: "Book returned successfully", data: borrow });
  }

  book.availableCopies += borrow.quantity;
  book.available = book.availableCopies > 0;
  await book.save();

  if (!borrow.fine && borrow.dueDate < new Date()) {
    const overdueDays = Math.ceil(
      (new Date().getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const amount = overdueDays * FINE_RATE_PER_DAY * borrow.quantity;

    try {
      const fine = await Fine.create({
        user: borrow.user,
        borrow: borrow._id,
        amount,
        reason: `Overdue by ${overdueDays} day(s) for "${book.title}"`,
      });
      borrow.fine = fine._id;
      await borrow.save();

      await User.findByIdAndUpdate(borrow.user, { $inc: { fineBalance: amount } });
    } catch (err: unknown) {
      if ((err as { code?: number })?.code !== 11000) throw err;
    }

    await notificationQueue.add("fine", {
      userId: borrow.user.toString(),
      type: "fine",
      title: "Fine Incurred",
      message: `A fine of $${amount} has been applied for overdue return of "${book.title}".`,
    });
  }

  await reservationQueue.add("fulfill", { bookId: book._id.toString() });

  return c.json({ success: true, message: "Book returned successfully", data: borrow });
});

borrowRoutes.get("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const query = borrowQuerySchema.parse(c.req.query());
  const filter = { user: userId };
  if (query.status) (filter as Record<string, unknown>).status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [data, total] = await Promise.all([
    Borrow.find(filter)
      .populate("user", "name email")
      .populate("book", "title isbn")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Borrow.countDocuments(filter),
  ]);

  return c.json({
    success: true,
    message: "Borrows retrieved",
    data,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
});

borrowRoutes.get("/", authenticate, authorize("admin"), async (c: Context) => {
  const query = borrowQuerySchema.parse(c.req.query());
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.userId) filter.user = query.userId;

  const skip = (query.page - 1) * query.limit;
  const [data, total] = await Promise.all([
    Borrow.find(filter)
      .populate("user", "name email")
      .populate("book", "title isbn")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Borrow.countDocuments(filter),
  ]);

  return c.json({
    success: true,
    message: "Borrows retrieved",
    data,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  });
});

borrowRoutes.get("/active", authenticate, authorize("admin"), async (c: Context) => {
  const borrows = await Borrow.find({ status: "active" })
    .populate("user", "name email")
    .populate("book", "title isbn");
  return c.json({ success: true, message: "Active borrows retrieved", data: borrows });
});

borrowRoutes.get("/overdue", authenticate, authorize("admin"), async (c: Context) => {
  const borrows = await Borrow.find({
    status: "active",
    dueDate: { $lt: new Date() },
  })
    .populate("user", "name email")
    .populate("book", "title isbn");
  return c.json({ success: true, message: "Overdue borrows retrieved", data: borrows });
});

borrowRoutes.get("/:id", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const borrow = await Borrow.findById(c.req.param("id"))
    .populate("user", "name email")
    .populate("book", "title isbn");
  if (!borrow) throw new NotFoundError("Borrow record not found");
  if (borrow.user._id.toString() !== userId && c.get("userRole") !== "admin") {
    throw new AppError("Forbidden", 403);
  }
  return c.json({ success: true, message: "Borrow retrieved", data: borrow });
});

export default borrowRoutes;
