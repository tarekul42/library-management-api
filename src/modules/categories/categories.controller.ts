import type { Context } from "hono";
import { z } from "zod";
import { ValidationError } from '../../shared/errors.js';
import * as categoryService from './categories.service.js';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parent: z.string().optional(),
});

export async function getAll(c: Context) {
  const data = await categoryService.getAll();
  return c.json({ success: true, message: "Categories retrieved", data });
}

export async function getById(c: Context) {
  const id = c.req.param("id") ?? "";
  const data = await categoryService.getById(id);
  return c.json({ success: true, message: "Category retrieved", data });
}

export async function create(c: Context) {
  const body = await c.req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const data = await categoryService.create(parsed.data);
  return c.json({ success: true, message: "Category created", data }, 201);
}

export async function update(c: Context) {
  const id = c.req.param("id") ?? "";
  const body = await c.req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const data = await categoryService.update(id, parsed.data);
  return c.json({ success: true, message: "Category updated", data });
}

export async function remove(c: Context) {
  const id = c.req.param("id") ?? "";
  await categoryService.remove(id);
  return c.json({ success: true, message: "Category deleted", data: null });
}
