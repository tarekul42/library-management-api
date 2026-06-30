import { Fine } from '../../models/fine.model.js';
import { User } from '../../models/user.model.js';
import { AppError, NotFoundError } from '../../shared/errors.js';

export async function getMyFines(userId: string) {
  return Fine.find({ user: userId }).populate({
    path: "borrow",
    populate: { path: "book", select: "title" },
  });
}

export async function getAll() {
  return Fine.find().populate("user", "name email").populate({
    path: "borrow",
    populate: { path: "book", select: "title" },
  });
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
