import type { Context } from "hono";
import { createAuthorSchema, updateAuthorSchema } from "../../schemas/author.schema";
import * as authorService from "./authors.service";

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
  const data = await authorService.getBooks(id);
  return c.json({ success: true, message: "Author books retrieved", data });
}

export async function create(c: Context) {
  const body = await c.req.json();
  const input = createAuthorSchema.parse(body);
  const data = await authorService.create(input);
  return c.json({ success: true, message: "Author created", data }, 201);
}

export async function update(c: Context) {
  const id = c.req.param("id") ?? "";
  const body = await c.req.json();
  const input = updateAuthorSchema.parse(body);
  const data = await authorService.update(id, input);
  return c.json({ success: true, message: "Author updated", data });
}

export async function remove(c: Context) {
  const id = c.req.param("id") ?? "";
  await authorService.remove(id);
  return c.json({ success: true, message: "Author deleted", data: null });
}
