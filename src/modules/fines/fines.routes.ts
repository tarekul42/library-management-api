import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Fine } from "../../models/fine.model";

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
  const fine = await Fine.findByIdAndUpdate(
    c.req.param("id"),
    { paid: true, paidAt: new Date() },
    { new: true },
  );
  return c.json({ success: true, message: "Fine paid", data: fine });
});

export default fineRoutes;
