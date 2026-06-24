import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { User } from "../../models/user.model";

const userRoutes = new Hono();

userRoutes.get("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const user = await User.findById(userId);
  return c.json({ success: true, message: "Profile retrieved", data: user });
});

userRoutes.put("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const user = await User.findByIdAndUpdate(userId, body, { new: true });
  return c.json({ success: true, message: "Profile updated", data: user });
});

userRoutes.get("/", authenticate, authorize("admin"), async (c: Context) => {
  const users = await User.find();
  return c.json({ success: true, message: "Users retrieved", data: users });
});

userRoutes.get("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const user = await User.findById(c.req.param("id"));
  return c.json({ success: true, message: "User retrieved", data: user });
});

userRoutes.put("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const body = await c.req.json();
  const user = await User.findByIdAndUpdate(c.req.param("id"), body, { new: true });
  return c.json({ success: true, message: "User updated", data: user });
});

export default userRoutes;
