import { connectRedis } from '../utils/redis.js';
import { createNotificationWorker } from './notification.worker.js';
import { createOverdueWorker, scheduleOverdueCheck } from './overdue.worker.js';
import { createReservationWorker } from './reservation.worker.js';
import { logger } from '../config/index.js';

let notificationWorker: ReturnType<typeof createNotificationWorker> | null = null;
let overdueWorker: ReturnType<typeof createOverdueWorker> | null = null;
let reservationWorker: ReturnType<typeof createReservationWorker> | null = null;

export async function startWorkers(): Promise<void> {
  await connectRedis();
  logger.info("Redis connected, starting BullMQ workers...");

  notificationWorker = createNotificationWorker();
  overdueWorker = createOverdueWorker();
  reservationWorker = createReservationWorker();

  await scheduleOverdueCheck();

  logger.info("All workers started");
}

export async function stopWorkers(): Promise<void> {
  await Promise.all([
    notificationWorker?.close(),
    overdueWorker?.close(),
    reservationWorker?.close(),
  ]);
  logger.info("All workers stopped");
}
