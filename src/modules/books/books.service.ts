import { Book } from "../../models/book.model";
import type { CreateBookInput, UpdateBookInput, BookQuery } from "../../schemas/book.schema";
import { AppError, NotFoundError } from "../../shared/errors";
import { PAGINATION } from "../../shared/constants";

export async function createBook(input: CreateBookInput) {
  const book = await Book.create({
    ...input,
    availableCopies: input.copies,
    available: input.copies > 0,
  });
  return book.populate("author");
}

export async function getBooks(query: BookQuery) {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.genre) {
    filter.genre = query.genre;
  }
  if (query.available !== undefined) {
    filter.available = query.available;
  }

  const sortField = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [data, total] = await Promise.all([
    Book.find(filter)
      .populate("author", "name")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    Book.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBookById(id: string) {
  const book = await Book.findById(id).populate("author");
  if (!book) throw new NotFoundError("Book not found");
  return book;
}

export async function updateBook(id: string, input: UpdateBookInput) {
  const book = await Book.findById(id);
  if (!book) throw new NotFoundError("Book not found");

  if (input.copies !== undefined) {
    const borrowedCount = book.copies - book.availableCopies;
    const newAvailableCopies = Math.max(0, input.copies - borrowedCount);
    const updated = await Book.findOneAndUpdate(
      { _id: id, copies: book.copies },
      { $set: { ...input, copies: input.copies, availableCopies: newAvailableCopies, available: newAvailableCopies > 0 } },
      { new: true },
    );
    if (!updated) throw new AppError("Book was modified concurrently, please retry", 409);
    return updated.populate("author");
  }

  const updated = await Book.findByIdAndUpdate(id, input, { new: true });
  if (!updated) throw new NotFoundError("Book not found");
  return updated.populate("author");
}

export async function deleteBook(id: string) {
  const book = await Book.findByIdAndDelete(id);
  if (!book) throw new NotFoundError("Book not found");
  return book;
}
