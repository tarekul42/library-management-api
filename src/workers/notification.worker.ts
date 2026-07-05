import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from '../utils/redis.js';
import { Notification } from '../models/notification.model.js';
import { getLogger } from '../config/index.js';

interface NotificationJob {
  userId: string;
  type: "due_reminder" | "overdue" | "fine" | "reservation_available";
  title: string;
  message: string;
}

export function createNotificationWorker(): Worker {
  const conn = getRedis() as unknown as ConnectionOptions;
  const worker = new Worker<NotificationJob>(
    "notifications",
    async (job) => {
      const { userId, type, title, message } = job.data;
      await Notification.create({ user: userId, type, title, message });
    },
    { connection: conn },
  );

  worker.on("error", (err) => {
    getLogger().error({ err }, "Notification worker error");
  });

  worker.on("completed", (job) => {
    getLogger().info(`Notification job ${job.id} completed: ${job.data.type}`);
  });

  worker.on("failed", (job, err) => {
    getLogger().error({ err }, `Notification job ${job?.id} failed`);
  });

  return worker;
}
