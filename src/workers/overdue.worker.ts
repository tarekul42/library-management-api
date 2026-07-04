import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from '../utils/redis.js';
import { Borrow, type IBorrowDocument } from '../models/borrow.model.js';
import { Fine } from '../models/fine.model.js';
import { User } from '../models/user.model.js';
import { getNotificationQueue, getOverdueQueue } from './queues.js';
import { getLogger } from '../config/index.js';
import { calculateOverdueDays, calculateFineAmount } from '../shared/overdue.js';
import { isDuplicateKeyError } from '../shared/errors.js';

async function processOverdueBorrow(borrow: IBorrowDocument, now: Date): Promise<void> {
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
    if (isDuplicateKeyError(err)) {
      getLogger().warn({ borrowId: borrow._id }, "Fine already exists for overdue borrow — marking as overdue without duplicate fine");
    } else {
      getLogger().error({ err, borrowId: borrow._id }, "Failed to process overdue borrow");
    }
  }
}

export function createOverdueWorker(): Worker {
  const conn = getRedis() as unknown as ConnectionOptions;
  const worker = new Worker(
    "overdue",
    async () => {
      const now = new Date();
      const overdueFilter = { status: "active" as const, dueDate: { $lt: now }, fine: { $exists: false } };

      await Borrow.updateMany(overdueFilter, { $set: { status: "overdue" } });

      const overdueBorrows = await Borrow.find({
        status: "overdue",
        dueDate: { $lt: now },
        fine: { $exists: false },
      }).populate("book", "title");

      if (overdueBorrows.length === 0) return;

      await Promise.all(overdueBorrows.map((b) => processOverdueBorrow(b, now)));

      getLogger().info(`Processed ${overdueBorrows.length} overdue borrow(s)`);
    },
    { connection: conn },
  );

  worker.on("completed", (job) => {
    getLogger().info(`Overdue check job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    getLogger().error({ err }, `Overdue check job ${job?.id} failed`);
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
