import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from "../utils/redis";
import { Borrow } from "../models/borrow.model";
import { Fine } from "../models/fine.model";
import { User } from "../models/user.model";
import { notificationQueue, overdueQueue } from "./queues";
import { logger } from "../config";
import { FINE_RATE_PER_DAY } from "../shared/constants";

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
        const overdueDays = Math.ceil(
          (now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const amount = overdueDays * FINE_RATE_PER_DAY * borrow.quantity;

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
          if ((err as { code?: number })?.code !== 11000) throw err;
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
