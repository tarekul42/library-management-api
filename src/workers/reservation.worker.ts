import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { getRedis } from '../utils/redis.js';
import { Reservation } from '../models/reservation.model.js';
import { Book } from '../models/book.model.js';
import { notificationQueue } from './queues.js';
import { logger } from '../config/index.js';

interface ReservationJob {
  bookId: string;
}

const conn = getRedis() as unknown as ConnectionOptions;

export function createReservationWorker(): Worker {
  const worker = new Worker<ReservationJob>(
    "reservations",
    async (job) => {
      const { bookId } = job.data;

      const nextReservation = await Reservation.findOneAndUpdate(
        { book: bookId, status: "waiting" },
        { status: "fulfilled" },
        { sort: { createdAt: 1 }, new: true },
      );
      if (!nextReservation) return;

      const book = await Book.findOneAndUpdate(
        { _id: bookId, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true },
      );
      if (!book) {
        await Reservation.findByIdAndUpdate(nextReservation._id, { status: "waiting" });
        return;
      }
      book.available = book.availableCopies > 0;
      await book.save();

      await notificationQueue.add("reservation-fulfilled", {
        userId: nextReservation.user.toString(),
        type: "reservation_available",
        title: "Reservation Fulfilled",
        message: `Your reservation for "${book.title}" is now available. Please proceed to borrow.`,
      });

      logger.info(`Reservation ${nextReservation._id} fulfilled for book "${book.title}"`);
    },
    { connection: conn },
  );

  worker.on("completed", (job) => {
    logger.info(`Reservation job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error({ err }, `Reservation job ${job?.id} failed`);
  });

  return worker;
}
