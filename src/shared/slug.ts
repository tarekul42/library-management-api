export function generateSlug(name: string): string {
  if (!name || name.trim().length === 0) throw new Error("Name is required to generate slug");
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (slug.length === 0) throw new Error("Could not generate slug from name");
  return slug;
}
