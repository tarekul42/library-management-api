import { Fine } from "../../models/fine.model";
import { User } from "../../models/user.model";
import { AppError, NotFoundError } from "../../shared/errors";

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
  if (fine.amount <= 0) throw new AppError("Invalid fine amount", 400);

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  if (user.fineBalance < fine.amount) throw new AppError("Insufficient balance", 400);

  fine.paid = true;
  await fine.save();

  await User.findByIdAndUpdate(userId, { $inc: { fineBalance: -fine.amount } });

  return fine;
}
