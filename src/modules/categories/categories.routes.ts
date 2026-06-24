import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Category } from "../../models/category.model";
import { NotFoundError } from "../../shared/errors";

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
  const category = await Category.create(body);
  return c.json({ success: true, message: "Category created", data: category }, 201);
});

categoryRoutes.put("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const body = await c.req.json();
  const category = await Category.findByIdAndUpdate(c.req.param("id"), body, { new: true });
  if (!category) throw new NotFoundError("Category not found");
  return c.json({ success: true, message: "Category updated", data: category });
});

categoryRoutes.delete("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const category = await Category.findByIdAndDelete(c.req.param("id"));
  if (!category) throw new NotFoundError("Category not found");
  return c.json({ success: true, message: "Category deleted", data: null });
});

export default categoryRoutes;
