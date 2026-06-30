import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from '../utils/redis.js';
import { Notification } from '../models/notification.model.js';
import { logger } from '../config/index.js';

interface NotificationJob {
  userId: string;
  type: "due_reminder" | "overdue" | "fine" | "reservation_available";
  title: string;
  message: string;
}

const conn = getRedis() as unknown as ConnectionOptions;

export function createNotificationWorker(): Worker {
  const worker = new Worker<NotificationJob>(
    "notifications",
    async (job) => {
      const { userId, type, title, message } = job.data;
      await Notification.create({ user: userId, type, title, message });
    },
    { connection: conn },
  );

  worker.on("completed", (job) => {
    logger.info(`Notification job ${job.id} completed: ${job.data.type}`);
  });

  worker.on("failed", (job, err) => {
    logger.error({ err }, `Notification job ${job?.id} failed`);
  });

  return worker;
}
