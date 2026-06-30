import { Category } from '../../models/category.model.js';
import { AppError, NotFoundError } from '../../shared/errors.js';
import { generateSlug } from '../../shared/slug.js';

export async function getAll() {
  return Category.find().sort({ name: 1 });
}

export async function getById(id: string) {
  const category = await Category.findById(id);
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

export async function create(data: { name: string; description?: string; parent?: string }) {
  const slug = generateSlug(data.name);
  const existing = await Category.findOne({ slug });
  if (existing) throw new AppError("A category with this name already exists", 409);
  return Category.create({ ...data, slug });
}

export async function update(id: string, data: Record<string, unknown>) {
  const updateData = { ...data };
  if (updateData.name && typeof updateData.name === "string") {
    updateData.slug = generateSlug(updateData.name);
  }
  const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

export async function remove(id: string) {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new NotFoundError("Category not found");
}
