import { Wishlist, type IWishlistDocument } from '../../models/wishlist.model.js';
import { AppError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';
import type { PaginationQuery, IPaginatedResult } from '../../shared/types.js';

export async function getMyWishlist(userId: string, query: PaginationQuery = {}): Promise<IPaginatedResult<IWishlistDocument>> {
  return paginate(Wishlist, { user: userId }, query, { path: "book" });
}

export async function addItem(userId: string, bookId: string) {
  const existing = await Wishlist.findOne({ user: userId, book: bookId });
  if (existing) throw new AppError("Book already in wishlist", 409);
  return Wishlist.create({ user: userId, book: bookId });
}

export async function removeItem(userId: string, bookId: string) {
  await Wishlist.findOneAndDelete({ user: userId, book: bookId });
}
