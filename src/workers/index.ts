import { connectRedis, isRedisReady } from '../utils/redis.js';
import { initQueues } from './queues.js';
import { createNotificationWorker } from './notification.worker.js';
import { createOverdueWorker, scheduleOverdueCheck } from './overdue.worker.js';
import { createReservationWorker } from './reservation.worker.js';
import { getLogger } from '../config/index.js';

let notificationWorker: ReturnType<typeof createNotificationWorker> | null = null;
let overdueWorker: ReturnType<typeof createOverdueWorker> | null = null;
let reservationWorker: ReturnType<typeof createReservationWorker> | null = null;

export async function startWorkers(): Promise<void> {
  await connectRedis();

  await initQueues();
  getLogger().info("Queues initialized");

  if (!isRedisReady()) {
    getLogger().warn("Redis unavailable — workers not started");
    return;
  }

  getLogger().info("Starting BullMQ workers...");
  notificationWorker = createNotificationWorker();
  overdueWorker = createOverdueWorker();
  reservationWorker = createReservationWorker();

  try {
    await scheduleOverdueCheck();
  } catch (err) {
    getLogger().warn({ err }, "Failed to schedule overdue check — queuing unavailable");
  }

  getLogger().info("All workers started");
}

export async function stopWorkers(): Promise<void> {
  await Promise.all([
    notificationWorker?.close(),
    overdueWorker?.close(),
    reservationWorker?.close(),
  ]);
  getLogger().info("All workers stopped");
}
