import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from '../utils/redis.js';
import { Borrow } from '../models/borrow.model.js';
import { Fine } from '../models/fine.model.js';
import { User } from '../models/user.model.js';
import { notificationQueue, overdueQueue } from './queues.js';
import { logger } from '../config/index.js';
import { calculateOverdueDays, calculateFineAmount } from '../shared/overdue.js';

const conn = getRedis() as unknown as ConnectionOptions;

export function createOverdueWorker(): Worker {
  const worker = new Worker(
    "overdue",
    async () => {
      const now = new Date();
      const overdueBorrows = await Borrow.find({
        status: "active",
        dueDate: { $lt: now },
        fine: { $exists: false },
      }).populate("book", "title");

      for (const borrow of overdueBorrows) {
        const overdueDays = calculateOverdueDays(borrow.dueDate, now);
        const amount = calculateFineAmount(overdueDays, borrow.quantity);

        try {
          const fine = await Fine.create({
            user: borrow.user,
            borrow: borrow._id,
            amount,
            reason: `Overdue by ${overdueDays} day(s) for "${(borrow.book as unknown as { title: string }).title}"`,
          });

          borrow.status = "overdue";
          borrow.fine = fine._id;
          await borrow.save();

          await User.findByIdAndUpdate(borrow.user, { $inc: { fineBalance: amount } });

          await notificationQueue.add("overdue", {
            userId: borrow.user.toString(),
            type: "overdue",
            title: "Book Overdue",
            message: `"${(borrow.book as unknown as { title: string }).title}" is overdue by ${overdueDays} day(s). A fine of $${amount} has been applied.`,
          });
        } catch (err: unknown) {
          const code = (err as { code?: number })?.code;
          if (code === 11000) {
            logger.warn({ borrowId: borrow._id }, "Fine already exists for overdue borrow — marking as overdue without duplicate fine");
            borrow.status = "overdue";
            await borrow.save();
          } else {
            logger.error({ err, borrowId: borrow._id }, "Failed to process overdue borrow");
          }
        }
      }

      if (overdueBorrows.length > 0) {
        logger.info(`Processed ${overdueBorrows.length} overdue borrow(s)`);
      }
    },
    { connection: conn },
  );

  worker.on("completed", (job) => {
    logger.info(`Overdue check job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error({ err }, `Overdue check job ${job?.id} failed`);
  });

  return worker;
}

export async function scheduleOverdueCheck(): Promise<void> {
  await overdueQueue.upsertJobScheduler(
    "overdue-check",
    { every: 30 * 60 * 1000 },
    { name: "overdue-check" },
  );
}
