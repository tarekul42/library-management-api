import { Notification, type INotificationDocument } from '../../models/notification.model.js';
import { NotFoundError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';
import type { PaginationQuery, IPaginatedResult } from '../../shared/types.js';

export async function getMyNotifications(userId: string, query: PaginationQuery = {}): Promise<IPaginatedResult<INotificationDocument>> {
  return paginate(
    Notification,
    { user: userId },
    { page: query.page, limit: query.limit, sort: { createdAt: -1 } },
  ) as Promise<IPaginatedResult<INotificationDocument>>;
}

export async function markRead(id: string, userId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { read: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) throw new NotFoundError("Notification not found");
  return notification;
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() });
}
