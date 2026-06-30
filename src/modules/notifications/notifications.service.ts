import { Notification } from "../../models/notification.model";
import { NotFoundError } from "../../shared/errors";

export async function getMyNotifications(userId: string) {
  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
}

export async function markRead(id: string, userId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { read: true },
    { new: true },
  );
  if (!notification) throw new NotFoundError("Notification not found");
  return notification;
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
}
