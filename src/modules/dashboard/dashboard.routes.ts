import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Book } from "../../models/book.model";
import { User } from "../../models/user.model";
import { Borrow } from "../../models/borrow.model";
import { Fine } from "../../models/fine.model";

const dashboardRoutes = new Hono();

dashboardRoutes.get("/stats", authenticate, authorize("admin"), async (c: Context) => {
  const [totalBooks, totalUsers, activeBorrows, overdueBorrows, totalFines] =
    await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ role: "member" }),
      Borrow.countDocuments({ status: "active" }),
      Borrow.countDocuments({ status: "active", dueDate: { $lt: new Date() } }),
      Fine.aggregate([
        { $match: { paid: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

  return c.json({
    success: true,
    message: "Dashboard stats retrieved",
    data: {
      totalBooks,
      totalUsers,
      activeBorrows,
      overdueBorrows,
      unpaidFines: totalFines[0]?.total || 0,
    },
  });
});

dashboardRoutes.get("/popular-books", authenticate, authorize("admin"), async (c: Context) => {
  const popular = await Borrow.aggregate([
    { $group: { _id: "$book", borrowCount: { $sum: 1 } } },
    { $sort: { borrowCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "books",
        localField: "_id",
        foreignField: "_id",
        as: "book",
      },
    },
    { $unwind: "$book" },
    { $project: { title: "$book.title", isbn: "$book.isbn", borrowCount: 1 } },
  ]);

  return c.json({ success: true, message: "Popular books retrieved", data: popular });
});

export default dashboardRoutes;
