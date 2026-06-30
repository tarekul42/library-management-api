import { Review } from '../../models/review.model.js';
import { Book } from '../../models/book.model.js';
import { AppError } from '../../shared/errors.js';

export async function getBookReviews(bookId: string) {
  return Review.find({ book: bookId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });
}

export async function createReview(userId: string, input: { book: string; rating: number; comment?: string }) {
  const existing = await Review.findOne({ book: input.book, user: userId });
  if (existing) throw new AppError("You have already reviewed this book", 409);

  const review = await Review.create({ ...input, user: userId });

  const [stats] = await Review.aggregate([
    { $match: { book: review.book } },
    { $group: { _id: "$book", avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
  ]);

  if (stats) {
    await Book.findByIdAndUpdate(review.book, {
      avgRating: Math.round(stats.avgRating * 10) / 10,
      reviewCount: stats.reviewCount,
    });
  }

  return review;
}
