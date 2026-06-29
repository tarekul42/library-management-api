import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Fine } from "../../models/fine.model";
import { User } from "../../models/user.model";
import { NotFoundError, ForbiddenError, AppError } from "../../shared/errors";

const fineRoutes = new Hono();

fineRoutes.get("/me", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const fines = await Fine.find({ user: userId })
    .populate({ path: "borrow", populate: { path: "book", select: "title isbn" } })
    .sort({ createdAt: -1 });
  return c.json({ success: true, message: "Fines retrieved", data: fines });
});

fineRoutes.get("/", authenticate, authorize("admin"), async (c: Context) => {
  const fines = await Fine.find()
    .populate("user", "name email")
    .populate({ path: "borrow", populate: { path: "book", select: "title isbn" } })
    .sort({ createdAt: -1 });
  return c.json({ success: true, message: "All fines retrieved", data: fines });
});

fineRoutes.post("/:id/pay", authenticate, async (c: Context) => {
  const userId = c.get("userId");
  const fine = await Fine.findById(c.req.param("id"));
  if (!fine) throw new NotFoundError("Fine not found");
  if (fine.user.toString() !== userId && c.get("userRole") !== "admin") {
    throw new ForbiddenError("You can only pay your own fines");
  }
  if (fine.paid) throw new AppError("Fine already paid", 400);

  fine.paid = true;
  fine.paidAt = new Date();
  await fine.save();

  await User.findByIdAndUpdate(fine.user, { $inc: { fineBalance: -fine.amount } });

  return c.json({ success: true, message: "Fine paid", data: fine });
});

export default fineRoutes;
