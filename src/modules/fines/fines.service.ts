import { Fine } from '../../models/fine.model.js';
import { User } from '../../models/user.model.js';
import { AppError, NotFoundError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';
import type { PaginationQuery, IPaginatedResult } from '../../shared/types.js';
import type { IFineDocument } from '../../models/fine.model.js';

function buildFineFilter(query: PaginationQuery, userId?: string): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (userId) filter.user = userId;
  if (query.status === "paid") filter.paid = true;
  if (query.status === "unpaid") filter.paid = false;
  return filter;
}

export async function getMyFines(userId: string, query: PaginationQuery = {}): Promise<IPaginatedResult<IFineDocument>> {
  return paginate(
    Fine,
    buildFineFilter(query, userId),
    { page: query.page, limit: query.limit, sort: { createdAt: -1 } },
    { path: "borrow", populate: { path: "book", select: "title" } },
  ) as Promise<IPaginatedResult<IFineDocument>>;
}

export async function getAll(query: PaginationQuery = {}): Promise<IPaginatedResult<IFineDocument>> {
  return paginate(
    Fine,
    buildFineFilter(query),
    { page: query.page, limit: query.limit, sort: { createdAt: -1 } },
    [
      { path: "user", select: "name email" },
      { path: "borrow", populate: { path: "book", select: "title" } },
    ],
  ) as Promise<IPaginatedResult<IFineDocument>>;
}

export async function payFine(fineId: string, userId: string) {
  const fine = await Fine.findById(fineId);
  if (!fine) throw new NotFoundError("Fine not found");
  if (fine.user.toString() !== userId) throw new AppError("Unauthorized", 403);
  if (fine.paid) throw new AppError("Fine already paid", 400);
  if (fine.amount <= 0) {
    fine.paid = true;
    fine.paidAt = new Date();
    await fine.save();
    return fine;
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  if (user.fineBalance < fine.amount) throw new AppError("Insufficient balance", 400);

  fine.paid = true;
  fine.paidAt = new Date();
  await fine.save();

  await User.findByIdAndUpdate(userId, { $inc: { fineBalance: -fine.amount } });

  return fine;
}
