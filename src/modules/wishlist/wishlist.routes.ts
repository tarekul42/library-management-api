import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate } from "../../middleware";
import { Wishlist } from "../../models/wishlist.model";
import { Book } from "../../models/book.model";
import { NotFoundError } from "../../shared/errors";

const wishlistRoutes = new Hono();

wishlistRoutes.get("/", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const items = await Wishlist.find({ user: userId })
    .populate("book", "title isbn genre coverImage availableCopies copies")
    .sort({ createdAt: -1 });
  return c.json({ success: true, message: "Wishlist retrieved", data: items });
});

wishlistRoutes.post("/:bookId", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const bookId = c.req.param("bookId");

  const book = await Book.findById(bookId);
  if (!book) throw new NotFoundError("Book not found");

  const existing = await Wishlist.findOne({ user: userId, book: bookId });
  if (existing) {
    return c.json({ success: false, message: "Book already in wishlist", data: existing }, 409);
  }

  const item = await Wishlist.create({ user: userId, book: bookId });
  return c.json({ success: true, message: "Added to wishlist", data: item }, 201);
});

wishlistRoutes.delete("/:bookId", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const bookId = c.req.param("bookId");
  const item = await Wishlist.findOneAndDelete({ user: userId, book: bookId });
  if (!item) throw new NotFoundError("Book not in wishlist");
  return c.json({ success: true, message: "Removed from wishlist", data: null });
});

export default wishlistRoutes;
