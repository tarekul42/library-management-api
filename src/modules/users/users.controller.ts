import type { Context } from "hono";
import { updateProfileSchema, updateUserSchema } from "../../schemas/user.schema";
import { ValidationError } from "../../shared/errors";
import * as userService from "./users.service";

export async function getMe(c: Context) {
  const userId = c.get("userId");
  const data = await userService.getMe(userId);
  return c.json({ success: true, message: "Profile retrieved", data });
}

export async function updateMe(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const data = await userService.updateMe(userId, parsed.data);
  return c.json({ success: true, message: "Profile updated", data });
}

export async function getMyHistory(c: Context) {
  const userId = c.get("userId");
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") ?? "10", 10)));
  const result = await userService.getMyHistory(userId, page, limit);
  return c.json({ success: true, message: "Borrow history retrieved", ...result });
}

export async function getAll(c: Context) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));
  const result = await userService.getAll(page, limit);
  return c.json({ success: true, message: "Users retrieved", ...result });
}

export async function getById(c: Context) {
  const id = c.req.param("id") ?? "";
  const data = await userService.getById(id);
  return c.json({ success: true, message: "User retrieved", data });
}

export async function updateById(c: Context) {
  const id = c.req.param("id") ?? "";
  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const data = await userService.updateById(id, parsed.data);
  return c.json({ success: true, message: "User updated", data });
}
