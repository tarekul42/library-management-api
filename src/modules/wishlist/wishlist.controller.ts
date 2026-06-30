import type { Context } from "hono";
import { z } from "zod";
import { ValidationError } from "../../shared/errors";
import * as wishlistService from "./wishlist.service";

const createWishlistSchema = z.object({
  book: z.string().min(1),
});

export async function getMyWishlist(c: Context) {
  const userId = c.get("userId");
  const data = await wishlistService.getMyWishlist(userId);
  return c.json({ success: true, message: "Wishlist retrieved", data });
}

export async function add(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createWishlistSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const data = await wishlistService.addItem(userId, parsed.data.book);
  return c.json({ success: true, message: "Book added to wishlist", data }, 201);
}

export async function remove(c: Context) {
  const userId = c.get("userId");
  const bookId = c.req.param("bookId") ?? "";
  await wishlistService.removeItem(userId, bookId);
  return c.json({ success: true, message: "Book removed from wishlist", data: null });
}
