import type { Context } from "hono";
import { createBookSchema, updateBookSchema, bookQuerySchema } from '../../schemas/book.schema.js';
import { ValidationError } from '../../shared/errors.js';
import * as bookService from './books.service.js';

export async function createBook(c: Context) {
  const body = await c.req.json();
  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const input = parsed.data;
  const data = await bookService.createBook(input);
  return c.json({ success: true, message: "Book created successfully", data }, 201);
}

export async function getBooks(c: Context) {
  const parsed = bookQuerySchema.safeParse(c.req.query());
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const query = parsed.data;
  const result = await bookService.getBooks(query);
  return c.json({ success: true, message: "Books retrieved successfully", ...result });
}

export async function getBookById(c: Context) {
  const id = c.req.param("bookId") ?? "";
  const data = await bookService.getBookById(id);
  return c.json({ success: true, message: "Book retrieved successfully", data });
}

export async function updateBook(c: Context) {
  const id = c.req.param("bookId") ?? "";
  const body = await c.req.json();
  const parsed = updateBookSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const input = parsed.data;
  const data = await bookService.updateBook(id, input);
  return c.json({ success: true, message: "Book updated successfully", data });
}

export async function deleteBook(c: Context) {
  const id = c.req.param("bookId") ?? "";
  await bookService.deleteBook(id);
  return c.body(null, 204);
}
