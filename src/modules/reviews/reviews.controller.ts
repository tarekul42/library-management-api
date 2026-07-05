import type { Context } from "hono";
import { z } from "zod";
import { ValidationError } from '../../shared/errors.js';
import * as reviewsService from './reviews.service.js';

const createReviewSchema = z.object({
  book: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function getBookReviews(c: Context) {
  const bookId = c.req.param("bookId") ?? "";
  const data = await reviewsService.getBookReviews(bookId);
  return c.json({ success: true, data });
}

export async function create(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const data = await reviewsService.createReview(userId, parsed.data);
  return c.json({ success: true, data }, 201);
}
