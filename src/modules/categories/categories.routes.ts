import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { authenticate, authorize } from "../../middleware";
import { Category } from "../../models/category.model";
import { NotFoundError, ValidationError } from "../../shared/errors";

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parent: z.string().optional(),
});

const categoryRoutes = new Hono();

categoryRoutes.get("/", async (c: Context) => {
  const categories = await Category.find().sort({ name: 1 });
  return c.json({ success: true, message: "Categories retrieved", data: categories });
});

categoryRoutes.get("/:id", async (c: Context) => {
  const category = await Category.findById(c.req.param("id"));
  if (!category) throw new NotFoundError("Category not found");
  return c.json({ success: true, message: "Category retrieved", data: category });
});

categoryRoutes.post("/", authenticate, authorize("admin"), async (c: Context) => {
  const body = await c.req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const slug = parsed.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const category = await Category.create({ ...parsed.data, slug });
  return c.json({ success: true, message: "Category created", data: category }, 201);
});

categoryRoutes.put("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const body = await c.req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const category = await Category.findByIdAndUpdate(c.req.param("id"), parsed.data, { new: true });
  if (!category) throw new NotFoundError("Category not found");
  return c.json({ success: true, message: "Category updated", data: category });
});

categoryRoutes.delete("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const category = await Category.findByIdAndDelete(c.req.param("id"));
  if (!category) throw new NotFoundError("Category not found");
  return c.json({ success: true, message: "Category deleted", data: null });
});

export default categoryRoutes;
