import { z } from "zod";
import { GENRES, getMaxPublishedYear } from "../shared/constants";

const genreSchema = z.enum(GENRES);

export const createBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().min(1, "Author ID is required"),
  genre: genreSchema,
  isbn: z.string().min(1, "ISBN is required"),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional(),
  pages: z.number().int().positive().optional(),
  publisher: z.string().max(200).optional(),
  publishedYear: z.number().int().min(1000).max(getMaxPublishedYear()).optional(),
  copies: z.number().int().min(0, "Copies must be at least 0"),
  tags: z.array(z.string()).default([]),
  shelfLocation: z.string().optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const bookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  genre: genreSchema.optional(),
  available: z.coerce.boolean().optional(),
  sortBy: z.enum(["title", "author", "createdAt", "avgRating"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookQuery = z.infer<typeof bookQuerySchema>;
