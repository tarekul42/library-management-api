import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate } from "../../middleware";
import { Notification } from "../../models/notification.model";

const notificationRoutes = new Hono();

notificationRoutes.get("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
  return c.json({ success: true, message: "Notifications retrieved", data: notifications });
});

notificationRoutes.put("/:id/read", authenticate, async (c: Context) => {
  const notification = await Notification.findByIdAndUpdate(
    c.req.param("id"),
    { read: true, readAt: new Date() },
    { new: true },
  );
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
