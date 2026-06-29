import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Reservation } from "../../models/reservation.model";
import { Book } from "../../models/book.model";
import { AppError, NotFoundError } from "../../shared/errors";

const reservationRoutes = new Hono();

reservationRoutes.post("/", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const bookId = body.bookId as string;

  if (!bookId) throw new AppError("bookId is required", 400);

  const book = await Book.findById(bookId);
  if (!book) throw new NotFoundError("Book not found");

  if (book.availableCopies > 0) {
    throw new AppError("Book is currently available, please borrow instead", 400);
  }

  const existing = await Reservation.findOne({
    user: userId,
    book: bookId,
    status: "waiting",
  });
  if (existing) {
    throw new AppError("You already have a pending reservation for this book", 409);
  }

  const position = await Reservation.countDocuments({ book: bookId, status: "waiting" });

  const reservation = await Reservation.create({
    user: userId,
    book: bookId,
  });

  return c.json({
    success: true,
    message: "Book reserved successfully",
    data: {
      ...reservation.toObject(),
      queuePosition: position + 1,
    },
  }, 201);
});

reservationRoutes.get("/", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const reservations = await Reservation.find({ user: userId })
    .populate({ path: "book", select: "title isbn genre coverImage author", populate: { path: "author", select: "name" } })
    .sort({ createdAt: -1 });
  return c.json({ success: true, message: "Reservations retrieved", data: reservations });
});

reservationRoutes.get("/all", authenticate, authorize("admin"), async (c: Context) => {
  const reservations = await Reservation.find()
    .populate("user", "name email")
    .populate({ path: "book", select: "title isbn", populate: { path: "author", select: "name" } })
    .sort({ createdAt: -1 });
  return c.json({ success: true, message: "All reservations retrieved", data: reservations });
});

reservationRoutes.get("/book/:bookId", authenticate, async (c: Context) => {
  const { bookId } = c.req.param();
  const reservations = await Reservation.find({ book: bookId, status: "waiting" })
    .populate("user", "name email")
    .sort({ createdAt: 1 });
  return c.json({ success: true, message: "Reservation queue retrieved", data: reservations });
});

reservationRoutes.delete("/:id", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const reservation = await Reservation.findById(c.req.param("id"));
  if (!reservation) throw new NotFoundError("Reservation not found");
  if (reservation.user.toString() !== userId && c.get("userRole") !== "admin") {
    throw new AppError("Unauthorized", 403);
  }
  if (reservation.status !== "waiting") {
    throw new AppError("Can only cancel waiting reservations", 400);
  }
  reservation.status = "cancelled";
  await reservation.save();
  return c.json({ success: true, message: "Reservation cancelled", data: reservation });
});

reservationRoutes.put("/:id/fulfill", authenticate, authorize("admin"), async (c: Context) => {
  const reservation = await Reservation.findById(c.req.param("id"));
  if (!reservation) throw new NotFoundError("Reservation not found");
  if (reservation.status !== "waiting") {
    throw new AppError("Reservation is not in waiting status", 400);
  }
  reservation.status = "fulfilled";
  await reservation.save();
  return c.json({ success: true, message: "Reservation fulfilled", data: reservation });
});

export default reservationRoutes;
