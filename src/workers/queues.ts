import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from "../utils/redis";

const conn = getRedis() as unknown as ConnectionOptions;
const defaultJobOptions = { attempts: 3, backoff: { type: "exponential" as const, delay: 2000 } };

function createQueue<T>(name: string): Queue<T> {
  return new Queue<T>(name, { connection: conn, defaultJobOptions });
}

export const notificationQueue = createQueue<{
  userId: string;
  type: string;
  title: string;
  message: string;
}>("notifications");

export const overdueQueue = createQueue("overdue");

export const reservationQueue = createQueue<{ bookId: string }>("reservations");
