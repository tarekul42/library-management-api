import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Borrow } from "../../models/borrow.model";
import { Book } from "../../models/book.model";
import { createBorrowSchema } from "../../schemas/borrow.schema";
import { AppError, NotFoundError } from "../../shared/errors";

const borrowRoutes = new Hono();

borrowRoutes.post("/", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = createBorrowSchema.parse(body);

  const book = await Book.findById(input.book);
  if (!book) throw new NotFoundError("Book not found");
  if (book.availableCopies < input.quantity) {
    throw new AppError(`Only ${book.availableCopies} copies available`, 400);
  }

  book.availableCopies -= input.quantity;
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
  if (book) {
    book.availableCopies += borrow.quantity;
    book.available = true;
    await book.save();
  }

  return c.json({ success: true, message: "Book returned successfully", data: borrow });
});

borrowRoutes.get("/", authenticate, async (c: Context) => {
  const isAdmin = c.get("userRole") === "admin";
  const query: Record<string, unknown> = {};
  if (!isAdmin) query.user = c.get("userId");
  if (c.req.query("status")) query.status = c.req.query("status");

  const borrows = await Borrow.find(query)
    .populate("user", "name email")
    .populate("book", "title isbn")
    .sort({ createdAt: -1 });
  return c.json({ success: true, message: "Borrows retrieved", data: borrows });
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
  const borrow = await Borrow.findById(c.req.param("id"))
    .populate("user", "name email")
    .populate("book", "title isbn");
  if (!borrow) throw new NotFoundError("Borrow record not found");
  return c.json({ success: true, message: "Borrow retrieved", data: borrow });
});

export default borrowRoutes;