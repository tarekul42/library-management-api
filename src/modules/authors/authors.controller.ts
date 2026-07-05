import type { Context } from "hono";
import { createAuthorSchema, updateAuthorSchema } from '../../schemas/author.schema.js';
import { ValidationError } from '../../shared/errors.js';
import * as authorService from './authors.service.js';

export async function getAll(c: Context) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
  const result = await authorService.getAll(page, limit);
  return c.json({ success: true, message: "Authors retrieved", ...result });
}

export async function getById(c: Context) {
  const id = c.req.param("id") ?? "";
  const data = await authorService.getById(id);
  return c.json({ success: true, message: "Author retrieved", data });
}

export async function getBooks(c: Context) {
  const id = c.req.param("id") ?? "";
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
  const result = await authorService.getBooks(id, page, limit);
  return c.json({ success: true, message: "Author books retrieved", ...result });
}

export async function create(c: Context) {
  const body = await c.req.json();
  const parsed = createAuthorSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const input = parsed.data;
  const data = await authorService.create(input);
  return c.json({ success: true, message: "Author created", data }, 201);
}

export async function update(c: Context) {
  const id = c.req.param("id") ?? "";
  const body = await c.req.json();
  const parsed = updateAuthorSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const input = parsed.data;
  const data = await authorService.update(id, input);
  return c.json({ success: true, message: "Author updated", data });
}

export async function remove(c: Context) {
  const id = c.req.param("id") ?? "";
  await authorService.remove(id);
  return c.json({ success: true, message: "Author deleted", data: null });
}
