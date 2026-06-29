import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { authenticate } from "../../middleware";
import { Review } from "../../models/review.model";
import { Book } from "../../models/book.model";
import { NotFoundError, ValidationError } from "../../shared/errors";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const reviewRoutes = new Hono();

reviewRoutes.get("/book/:bookId", async (c: Context) => {
  const reviews = await Review.find({ book: c.req.param("bookId") })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });
  return c.json({ success: true, message: "Reviews retrieved", data: reviews });
});

reviewRoutes.post("/book/:bookId", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const bookId = c.req.param("bookId");

  const book = await Book.findById(bookId);
  if (!book) throw new NotFoundError("Book not found");

  const review = await Review.create({
    user: userId,
    book: bookId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  const stats = await Review.aggregate([
    { $match: { book: review.book } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    book.avgRating = Math.round(stats[0].avgRating * 10) / 10;
    book.reviewCount = stats[0].count;
    await book.save();
  }

  return c.json({ success: true, message: "Review created", data: review }, 201);
});

export default reviewRoutes;
