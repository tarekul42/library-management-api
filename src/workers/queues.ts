import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from "../utils/redis";

const conn = getRedis() as unknown as ConnectionOptions;

export const notificationQueue = new Queue("notifications", {
  connection: conn,
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
});

export const overdueQueue = new Queue("overdue", {
  connection: conn,
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
});

export const reservationQueue = new Queue("reservations", {
  connection: conn,
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
});
