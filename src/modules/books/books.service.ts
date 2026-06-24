import { Book } from "../../models/book.model";
import type { CreateBookInput, UpdateBookInput, BookQuery } from "../../schemas/book.schema";
import { NotFoundError } from "../../shared/errors";
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

  Object.assign(book, input);
  if (input.copies !== undefined) {
    book.availableCopies = input.copies;
    book.available = input.copies > 0;
  }
  await book.save();

  return book.populate("author");
}

export async function deleteBook(id: string) {
  const book = await Book.findByIdAndDelete(id);
  if (!book) throw new NotFoundError("Book not found");
  return book;
}
