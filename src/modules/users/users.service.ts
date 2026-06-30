import { User } from "../../models/user.model";
import { Borrow } from "../../models/borrow.model";
import { NotFoundError } from "../../shared/errors";
import { findByIdOrThrow } from "../../shared/utils";

export async function getMe(userId: string) {
  const user = await findByIdOrThrow(User, userId, "User not found");
  return user;
}

export async function updateMe(userId: string, data: Record<string, unknown>) {
  const user = await User.findByIdAndUpdate(userId, data, { new: true });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function getMyHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [borrows, total] = await Promise.all([
    Borrow.find({ user: userId })
      .populate("book", "title isbn coverImage")
      .sort({ borrowedAt: -1 })
      .skip(skip)
      .limit(limit),
    Borrow.countDocuments({ user: userId }),
  ]);
  return { data: borrows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getAll(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getById(id: string) {
  return findByIdOrThrow(User, id, "User not found");
}

export async function updateById(id: string, data: Record<string, unknown>) {
  const user = await User.findByIdAndUpdate(id, data, { new: true });
  if (!user) throw new NotFoundError("User not found");
  return user;
}
