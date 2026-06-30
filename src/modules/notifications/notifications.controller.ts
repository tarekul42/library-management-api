import type { Context } from "hono";
import * as notificationService from "./notifications.service";

export async function getMyNotifications(c: Context) {
  const userId = c.get("userId");
  const data = await notificationService.getMyNotifications(userId);
  return c.json({ success: true, message: "Notifications retrieved", data });
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
