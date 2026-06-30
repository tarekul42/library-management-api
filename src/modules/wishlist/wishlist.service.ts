import { Wishlist } from '../../models/wishlist.model.js';
import { AppError } from '../../shared/errors.js';

export async function getMyWishlist(userId: string) {
  const items = await Wishlist.find({ user: userId }).populate("book");
  return items.map((item) => item.book);
}

export async function addItem(userId: string, bookId: string) {
  const existing = await Wishlist.findOne({ user: userId, book: bookId });
  if (existing) throw new AppError("Book already in wishlist", 409);
  return Wishlist.create({ user: userId, book: bookId });
}

export async function removeItem(userId: string, bookId: string) {
  await Wishlist.findOneAndDelete({ user: userId, book: bookId });
}
