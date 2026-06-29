import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate } from "../../middleware";
import { Notification } from "../../models/notification.model";
import { NotFoundError, ForbiddenError } from "../../shared/errors";

const notificationRoutes = new Hono();

notificationRoutes.get("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
  return c.json({ success: true, message: "Notifications retrieved", data: notifications });
});

notificationRoutes.put("/:id/read", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const notification = await Notification.findById(c.req.param("id"));
  if (!notification) throw new NotFoundError("Notification not found");
  if (notification.user.toString() !== userId) {
    throw new ForbiddenError("You can only read your own notifications");
  }
  notification.read = true;
  notification.readAt = new Date();
  await notification.save();
  return c.json({ success: true, message: "Notification marked as read", data: notification });
});

notificationRoutes.put("/read-all", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  await Notification.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() },
  );
  return c.json({ success: true, message: "All notifications marked as read" });
});

export default notificationRoutes;
