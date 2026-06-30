import { Borrow } from "../../models/borrow.model";
import { Book } from "../../models/book.model";
import { Fine } from "../../models/fine.model";
import { User } from "../../models/user.model";
import { AppError, NotFoundError } from "../../shared/errors";
import { MAX_BORROW_BOOKS, MAX_BORROW_DAYS } from "../../shared/constants";
import { calculateOverdueDays, calculateFineAmount } from "../../shared/overdue";
import { notificationQueue, reservationQueue } from "../../workers/queues";

export async function createBorrow(userId: string, input: { book: string; dueDate: Date; quantity: number }) {
  const now = new Date();
  const maxDue = new Date(now);
  maxDue.setDate(maxDue.getDate() + MAX_BORROW_DAYS);
  if (input.dueDate > maxDue) {
    throw new AppError(`Due date cannot exceed ${MAX_BORROW_DAYS} days from today`, 400);
  }

  const [activeCount, overdueCount] = await Promise.all([
    Borrow.countDocuments({ user: userId, status: "active" }),
    Borrow.countDocuments({ user: userId, status: "overdue" }),
  ]);

  if (activeCount >= MAX_BORROW_BOOKS) {
    throw new AppError(`You can only borrow up to ${MAX_BORROW_BOOKS} books at a time`, 400);
  }
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

  return Borrow.create({
    user: userId,
    book: input.book,
    quantity: input.quantity,
    dueDate: input.dueDate,
  });
}

export async function returnBorrow(borrowId: string, userId: string, userRole: string) {
  const borrow = await Borrow.findById(borrowId);
  if (!borrow) throw new NotFoundError("Borrow record not found");
  if (borrow.user.toString() !== userId && userRole !== "admin") {
    throw new AppError("Unauthorized", 403);
  }

  borrow.returnedAt = new Date();
  borrow.status = "returned";
  await borrow.save();

  const book = await Book.findById(borrow.book);
  if (book) {
    book.availableCopies += borrow.quantity;
    book.available = book.availableCopies > 0;
    await book.save();
  }

  if (!borrow.fine && borrow.dueDate < new Date()) {
    const overdueDays = calculateOverdueDays(borrow.dueDate);
    const amount = calculateFineAmount(overdueDays, borrow.quantity);

    try {
      const fine = await Fine.create({
        user: borrow.user,
        borrow: borrow._id,
        amount,
        reason: `Overdue by ${overdueDays} day(s) for "${book?.title ?? "Unknown"}"`,
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
      message: `A fine of $${amount} has been applied for overdue return of "${book?.title ?? "Unknown"}".`,
    });
  }

  await reservationQueue.add("fulfill", { bookId: (book?._id ?? borrow.book).toString() });

  return borrow;
}

export async function getUserBorrows(userId: string, query: { page: number; limit: number; status?: string }) {
  const filter: Record<string, unknown> = { user: userId };
  if (query.status) filter.status = query.status;

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

  return {
    data,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

export async function getAllBorrows(query: { page: number; limit: number; status?: string; userId?: string }) {
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

  return {
    data,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

export async function getActiveBorrows() {
  return Borrow.find({ status: "active" })
    .populate("user", "name email")
    .populate("book", "title isbn");
}

export async function getOverdueBorrows() {
  return Borrow.find({ status: "active", dueDate: { $lt: new Date() } })
    .populate("user", "name email")
    .populate("book", "title isbn");
}

export async function getBorrowById(borrowId: string) {
  const borrow = await Borrow.findById(borrowId)
    .populate("user", "name email")
    .populate("book", "title isbn");
  if (!borrow) throw new NotFoundError("Borrow record not found");
  return borrow;
}
