import { Borrow, IBorrowDocument } from '../../models/borrow.model.js';
import { Book } from '../../models/book.model.js';
import { Fine } from '../../models/fine.model.js';
import { User } from '../../models/user.model.js';
import { AppError, NotFoundError } from '../../shared/errors.js';
import { MAX_BORROW_BOOKS, MAX_BORROW_DAYS, MAX_RENEWALS } from '../../shared/constants.js';
import { calculateOverdueDays, calculateFineAmount } from '../../shared/overdue.js';
import { getNotificationQueue, getReservationQueue } from '../../workers/queues.js';
import { paginate } from '../../shared/pagination.js';
import { PaginationQuery, IPaginatedResult } from '../../shared/types.js';

export async function createBorrow(userId: string, input: { book: string; dueDate: Date; quantity: number }) {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dueDateUTC = new Date(Date.UTC(input.dueDate.getUTCFullYear(), input.dueDate.getUTCMonth(), input.dueDate.getUTCDate()));
  const maxDue = new Date(now);
  maxDue.setDate(maxDue.getDate() + MAX_BORROW_DAYS);
  if (input.dueDate > maxDue) {
    throw new AppError(`Due date cannot exceed ${MAX_BORROW_DAYS} days from today`, 400);
  }

  if (dueDateUTC < todayUTC) {
    throw new AppError("Due date cannot be in the past", 400);
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

  if (book.availableCopies <= 0) {
    await book.updateOne({ $set: { available: false } });
  }

  return Borrow.create({
    user: userId,
    book: input.book,
    quantity: input.quantity,
    dueDate: input.dueDate,
  });
}

function assertBorrowOwnership(borrow: IBorrowDocument, userId: string, userRole: string): void {
  if (borrow.user.toString() !== userId && userRole !== "admin") {
    throw new AppError("Unauthorized", 403);
  }
}

async function handleOverdueReturn(
  borrow: IBorrowDocument,
  bookTitle: string | undefined,
): Promise<void> {
  if (borrow.fine || !(borrow.dueDate < new Date())) return;

  const overdueDays = calculateOverdueDays(borrow.dueDate);
  const amount = calculateFineAmount(overdueDays, borrow.quantity);
  const title = bookTitle ?? "Unknown";

  try {
    const fine = await Fine.create({
      user: borrow.user,
      borrow: borrow._id,
      amount,
      reason: `Overdue by ${overdueDays} day(s) for "${title}"`,
    });
    borrow.fine = fine._id;
    await borrow.save();
    await User.findByIdAndUpdate(borrow.user, { $inc: { fineBalance: amount } });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code !== 11000) throw err;
  }

  await getNotificationQueue().add("fine", {
    userId: borrow.user.toString(),
    type: "fine",
    title: "Fine Incurred",
    message: `A fine of $${amount} has been applied for overdue return of "${title}".`,
  });
}

export async function returnBorrow(borrowId: string, userId: string, userRole: string) {
  const borrow = await Borrow.findById(borrowId);
  if (!borrow) throw new NotFoundError("Borrow record not found");
  assertBorrowOwnership(borrow, userId, userRole);

  borrow.returnedAt = new Date();
  borrow.status = "returned";
  await borrow.save();

  const book = await Book.findByIdAndUpdate(
    borrow.book,
    [
      { $set: { availableCopies: { $add: ["$availableCopies", borrow.quantity] } } },
      { $set: { available: { $gt: ["$availableCopies", 0] } } },
    ],
    { new: true },
  );

  await handleOverdueReturn(borrow, book?.title);

  await getReservationQueue().add("fulfill", { bookId: (book?._id ?? borrow.book).toString() });

  return borrow;
}

export async function renewBorrow(borrowId: string, userId: string, userRole: string) {
  const borrow = await Borrow.findById(borrowId);
  if (!borrow) throw new NotFoundError("Borrow record not found");
  assertBorrowOwnership(borrow, userId, userRole);
  if (borrow.status !== "active") {
    throw new AppError("Only active borrows can be renewed", 400);
  }
  if (borrow.renewalCount >= MAX_RENEWALS) {
    throw new AppError(`Maximum renewals (${MAX_RENEWALS}) reached`, 400);
  }

  const newDueDate = new Date(borrow.dueDate);
  newDueDate.setDate(newDueDate.getDate() + MAX_BORROW_DAYS);
  borrow.dueDate = newDueDate;
  borrow.renewalCount += 1;
  await borrow.save();

  return borrow;
}

async function getBorrows(
  filter: Record<string, unknown>,
  query: PaginationQuery,
): Promise<IPaginatedResult<IBorrowDocument>> {
  return paginate(
    Borrow,
    filter,
    { page: query.page, limit: query.limit, sort: query.sort || { createdAt: -1 } },
    [
      { path: "book", select: "title author isbn coverImage" },
      { path: "user", select: "name email" },
    ],
  ) as Promise<IPaginatedResult<IBorrowDocument>>;
}

export async function getUserBorrows(userId: string, query: PaginationQuery): Promise<IPaginatedResult<IBorrowDocument>> {
  return getBorrows({ user: userId }, query);
}

export async function getAllBorrows(query: PaginationQuery): Promise<IPaginatedResult<IBorrowDocument>> {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  return getBorrows(filter, query);
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
