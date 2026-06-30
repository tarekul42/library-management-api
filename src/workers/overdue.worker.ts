import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from '../utils/redis.js';
import { Borrow } from '../models/borrow.model.js';
import { Fine } from '../models/fine.model.js';
import { User } from '../models/user.model.js';
import { getNotificationQueue, getOverdueQueue } from './queues.js';
import { logger } from '../config/index.js';
import { calculateOverdueDays, calculateFineAmount } from '../shared/overdue.js';

const conn = getRedis() as unknown as ConnectionOptions;

export function createOverdueWorker(): Worker {
  const worker = new Worker(
    "overdue",
    async () => {
      const now = new Date();
      let processedCount = 0;

      while (true) {
        const borrow = await Borrow.findOneAndUpdate(
          { status: "active", dueDate: { $lt: now }, fine: { $exists: false } },
          { $set: { status: "overdue" } },
          { new: true },
        ).populate("book", "title");

        if (!borrow) break;

        processedCount++;
        const overdueDays = calculateOverdueDays(borrow.dueDate, now);
        const amount = calculateFineAmount(overdueDays, borrow.quantity);
        const bookTitle = (borrow.book as { title?: string })?.title || "Unknown Book";

        try {
          const fine = await Fine.create({
            user: borrow.user,
            borrow: borrow._id,
            amount,
            reason: `Overdue by ${overdueDays} day(s) for "${bookTitle}"`,
          });

          borrow.fine = fine._id;
          await borrow.save();

          await User.findByIdAndUpdate(borrow.user, { $inc: { fineBalance: amount } });

          await getNotificationQueue().add("overdue", {
            userId: borrow.user.toString(),
            type: "overdue",
            title: "Book Overdue",
            message: `"${bookTitle}" is overdue by ${overdueDays} day(s). A fine of $${amount} has been applied.`,
          });
        } catch (err: unknown) {
          const code = (err as { code?: number })?.code;
          if (code === 11000) {
            logger.warn({ borrowId: borrow._id }, "Fine already exists for overdue borrow — marking as overdue without duplicate fine");
          } else {
            logger.error({ err, borrowId: borrow._id }, "Failed to process overdue borrow");
          }
        }
      }

      if (processedCount > 0) {
        logger.info(`Processed ${processedCount} overdue borrow(s)`);
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
  await getOverdueQueue().upsertJobScheduler(
    "overdue-check",
    { every: 30 * 60 * 1000 },
    { name: "overdue-check" },
  );
}
