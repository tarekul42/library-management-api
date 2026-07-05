import { Category } from '../../models/category.model.js';
import { AppError, NotFoundError } from '../../shared/errors.js';
import { generateSlug } from '../../shared/slug.js';
import { getOrSet, invalidateCache, buildKey } from '../../utils/cache.js';

const CATEGORY_CACHE_ALL = buildKey("categories", "all");
const CATEGORY_CACHE_TTL = 300;

export async function getAll() {
  return getOrSet(CATEGORY_CACHE_ALL, () => Category.find().sort({ name: 1 }), CATEGORY_CACHE_TTL);
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
  const category = await Category.create({ ...data, slug });
  await invalidateCache(CATEGORY_CACHE_ALL);
  return category;
}

export async function update(id: string, data: Record<string, unknown>) {
  const updateData = { ...data };
  if (updateData.name && typeof updateData.name === "string") {
    updateData.slug = generateSlug(updateData.name);
  }
  const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
  if (!category) throw new NotFoundError("Category not found");
  await invalidateCache(CATEGORY_CACHE_ALL);
  return category;
}

export async function remove(id: string) {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new NotFoundError("Category not found");
  await invalidateCache(CATEGORY_CACHE_ALL);
}
