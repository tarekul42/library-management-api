import { Book } from "../../models/book.model";
import { User } from "../../models/user.model";
import { Borrow } from "../../models/borrow.model";
import { Fine } from "../../models/fine.model";

export async function getStats() {
  const [totalBooks, totalUsers, activeBorrows, overdueBorrows, totalFines] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ isActive: true }),
    Borrow.countDocuments({ status: "active" }),
    Borrow.countDocuments({ status: "overdue" }),
    Fine.aggregate([
      { $match: { paid: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return {
    totalBooks,
    totalUsers,
    activeBorrows,
    overdueBorrows,
    unpaidFines: totalFines[0]?.total || 0,
  };
}

export async function getPopularBooks() {
  return Borrow.aggregate([
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
    {
      $project: {
        _id: "$book._id",
        title: "$book.title",
        author: "$book.author",
        coverImage: "$book.coverImage",
        borrowCount: 1,
      },
    },
  ]);
}

export async function getTrends() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  return Borrow.aggregate([
    { $match: { borrowedAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$borrowedAt" }, month: { $month: "$borrowedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        count: 1,
      },
    },
  ]);
}

export async function getGenreDistribution() {
  return Book.aggregate([
    { $group: { _id: "$genre", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, genre: "$_id", count: 1 } },
  ]);
}
