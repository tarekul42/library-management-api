import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { User } from "../../models/user.model";
import { Borrow } from "../../models/borrow.model";
import { updateProfileSchema, updateUserSchema } from "../../schemas/user.schema";
import { NotFoundError, ValidationError } from "../../shared/errors";

const userRoutes = new Hono();

userRoutes.get("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  return c.json({ success: true, message: "Profile retrieved", data: user });
});

userRoutes.put("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const user = await User.findByIdAndUpdate(userId, parsed.data, { new: true });
  return c.json({ success: true, message: "Profile updated", data: user });
});

userRoutes.get("/me/history", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const borrows = await Borrow.find({ user: userId })
    .populate("book", "title isbn coverImage")
    .sort({ borrowedAt: -1 });
  return c.json({ success: true, message: "Borrow history retrieved", data: borrows });
});

userRoutes.get("/", authenticate, authorize("admin"), async (c: Context) => {
  const users = await User.find();
  return c.json({ success: true, message: "Users retrieved", data: users });
});

userRoutes.get("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const user = await User.findById(c.req.param("id"));
  if (!user) throw new NotFoundError("User not found");
  return c.json({ success: true, message: "User retrieved", data: user });
});

userRoutes.put("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const user = await User.findByIdAndUpdate(c.req.param("id"), parsed.data, { new: true });
  return c.json({ success: true, message: "User updated", data: user });
});

export default userRoutes;
