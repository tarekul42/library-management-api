import type { Context } from "hono";
import { createBookSchema, updateBookSchema, bookQuerySchema } from '../../schemas/book.schema.js';
import { validateObjectId } from '../../shared/utils.js';
import * as bookService from './books.service.js';

export async function createBook(c: Context) {
  const body = await c.req.json();
  const input = createBookSchema.parse(body);
  const data = await bookService.createBook(input);
  return c.json({ success: true, message: "Book created successfully", data }, 201);
}

export async function getBooks(c: Context) {
  const query = bookQuerySchema.parse(c.req.query());
  const result = await bookService.getBooks(query);
  return c.json({ success: true, message: "Books retrieved successfully", ...result });
}

export async function getBookById(c: Context) {
  const id = c.req.param("bookId") ?? "";
  validateObjectId(id, "Book ID");
  const data = await bookService.getBookById(id);
  return c.json({ success: true, message: "Book retrieved successfully", data });
}

export async function updateBook(c: Context) {
  const id = c.req.param("bookId") ?? "";
  validateObjectId(id, "Book ID");
  const body = await c.req.json();
  const input = updateBookSchema.parse(body);
  const data = await bookService.updateBook(id, input);
  return c.json({ success: true, message: "Book updated successfully", data });
}

export async function deleteBook(c: Context) {
  const id = c.req.param("bookId") ?? "";
  validateObjectId(id, "Book ID");
  await bookService.deleteBook(id);
  return c.json({ success: true, message: "Book deleted successfully", data: null });
}
