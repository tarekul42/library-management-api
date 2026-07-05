import type { Context } from "hono";
import { z } from "zod";
import { ValidationError } from '../../shared/errors.js';
import * as notificationService from './notifications.service.js';

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function getMyNotifications(c: Context) {
  const userId = c.get("userId");
  const parsed = notificationQuerySchema.safeParse(c.req.query());
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const query = parsed.data;
  const result = await notificationService.getMyNotifications(userId, query);
  return c.json({ success: true, message: "Notifications retrieved", ...result });
}

export async function markRead(c: Context) {
  const userId = c.get("userId");
  const id = c.req.param("id") ?? "";
  const data = await notificationService.markRead(id, userId);
  return c.json({ success: true, message: "Notification marked as read", data });
}

export async function markAllRead(c: Context) {
  const userId = c.get("userId");
  await notificationService.markAllRead(userId);
  return c.json({ success: true, message: "All notifications marked as read", data: null });
}
