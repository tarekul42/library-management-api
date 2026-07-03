import { Book } from '../../models/book.model.js';
import type { CreateBookInput, UpdateBookInput, BookQuery } from '../../schemas/book.schema.js';
import { NotFoundError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';

export async function createBook(input: CreateBookInput) {
  const book = await Book.create({
    ...input,
    availableCopies: input.copies,
    available: input.copies > 0,
  });
  return book.populate("author");
}

export async function getBooks(query: BookQuery) {
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

  return paginate(Book, filter, { page: query.page, limit: query.limit, sort: { [sortField]: sortOrder } }, "author name");
}

export async function getBookById(id: string) {
  const book = await Book.findById(id).populate("author");
  if (!book) throw new NotFoundError("Book not found");
  return book;
}

export async function updateBook(id: string, input: UpdateBookInput) {
  if (input.copies !== undefined) {
    const updated = await Book.findByIdAndUpdate(
      id,
      { $set: { ...input, availableCopies: input.copies, available: input.copies > 0 } },
      { new: true },
    );
    if (!updated) throw new NotFoundError("Book not found");
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
