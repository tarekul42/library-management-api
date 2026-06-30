import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from '../utils/redis.js';

const defaultJobOptions = { attempts: 3, backoff: { type: "exponential" as const, delay: 2000 } };

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
}

interface ReservationData {
  bookId: string;
}

let _notificationQueue: Queue<NotificationData> | null = null;
let _overdueQueue: Queue | null = null;
let _reservationQueue: Queue<ReservationData> | null = null;

function createQueue<T>(name: string): Queue<T> {
  const conn = getRedis() as unknown as ConnectionOptions;
  return new Queue<T>(name, { connection: conn, defaultJobOptions });
}

export async function initQueues(): Promise<void> {
  _notificationQueue = createQueue<NotificationData>("notifications");
  _overdueQueue = createQueue("overdue");
  _reservationQueue = createQueue<ReservationData>("reservations");
}

export function getNotificationQueue(): Queue<NotificationData> {
  if (!_notificationQueue) throw new Error("Queues not initialized. Call initQueues() first.");
  return _notificationQueue;
}

export function getOverdueQueue(): Queue {
  if (!_overdueQueue) throw new Error("Queues not initialized. Call initQueues() first.");
  return _overdueQueue;
}

export function getReservationQueue(): Queue<ReservationData> {
  if (!_reservationQueue) throw new Error("Queues not initialized. Call initQueues() first.");
  return _reservationQueue;
}
