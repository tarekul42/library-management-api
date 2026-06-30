import { Reservation } from "../../models/reservation.model";
import { Book } from "../../models/book.model";
import { AppError, NotFoundError } from "../../shared/errors";

export async function getMyReservations(userId: string) {
  return Reservation.find({ user: userId })
    .populate("book", "title author isbn coverImage")
    .sort({ createdAt: -1 });
}

export async function createReservation(userId: string, bookId: string) {
  const book = await Book.findById(bookId);
  if (!book) throw new NotFoundError("Book not found");
  if (book.availableCopies > 0) throw new AppError("Book is currently available", 400);

  const existing = await Reservation.findOne({ book: bookId, user: userId, status: "waiting" });
  if (existing) throw new AppError("You already have a reservation for this book", 409);

  return Reservation.create({ user: userId, book: bookId });
}

export async function cancelReservation(id: string, userId: string) {
  const reservation = await Reservation.findOne({ _id: id, user: userId });
  if (!reservation) throw new NotFoundError("Reservation not found");
  reservation.status = "cancelled";
  await reservation.save();
}

export async function fulfillReservation(id: string) {
  const reservation = await Reservation.findById(id);
  if (!reservation) throw new NotFoundError("Reservation not found");

  const book = await Book.findById(reservation.book);
  if (!book || book.availableCopies <= 0) {
    throw new AppError("No copies available to fulfill reservation", 400);
  }

  reservation.status = "fulfilled";
  await reservation.save();

  await Book.findByIdAndUpdate(reservation.book, { $inc: { availableCopies: -1 } });

  return reservation;
}
