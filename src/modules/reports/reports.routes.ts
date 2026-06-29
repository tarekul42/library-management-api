import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Borrow } from "../../models/borrow.model";
import { Fine } from "../../models/fine.model";
import { Book } from "../../models/book.model";
import { AppError } from "../../shared/errors";
import { generatePDF, respondWithPDF } from "../../shared/pdf";

const reportRoutes = new Hono();

function csvSerialize(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    const sanitized = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${sanitized.replace(/"/g, '""')}"`;
  };
  return [
    headers.map((h) => esc(h)).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
}

function setCSVHeaders(c: Context, filename: string): void {
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="${filename}.csv"`);
}

function parseDateParam(value: string | undefined, label: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) throw new AppError(`Invalid ${label} date: "${value}"`, 400);
  return date;
}

async function respondReport(
  c: Context,
  title: string,
  headers: string[],
  rows: Record<string, unknown>[],
  colWidths: number[],
  filename: string,
  pdfOptions?: { layout?: "portrait" | "landscape"; fontSize?: number },
) {
  const format = c.req.query("format") || "csv";

  if (format === "pdf") {
    const pdf = await generatePDF(title, headers, rows, colWidths, filename, pdfOptions);
    return respondWithPDF(c, pdf, filename);
  }

  setCSVHeaders(c, filename);
  return c.newResponse(csvSerialize(rows));
}

function populated<T>(doc: unknown): T | null {
  if (!doc || typeof doc !== "object") return null;
  return doc as T;
}

reportRoutes.get("/borrows", authenticate, authorize("admin"), async (c: Context) => {
  const from = parseDateParam(c.req.query("from"), "from");
  const to = parseDateParam(c.req.query("to"), "to");
  const status = c.req.query("status");

  const filter: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = from;
    if (to) dateFilter.$lte = to;
    filter.createdAt = dateFilter;
  }
  if (status) filter.status = status;

  const borrows = await Borrow.find(filter)
    .populate("user", "name email")
    .populate("book", "title isbn")
    .sort({ createdAt: -1 })
    .lean();

  const rows = borrows.map((b) => ({
    ID: b._id.toString(),
    User: populated<{ name: string }>(b.user)?.name ?? "",
    Email: populated<{ email: string }>(b.user)?.email ?? "",
    Book: populated<{ title: string }>(b.book)?.title ?? "",
    ISBN: populated<{ isbn: string }>(b.book)?.isbn ?? "",
    Quantity: b.quantity,
    Status: b.status,
    Borrowed: b.borrowedAt?.toISOString() ?? "",
    Due: b.dueDate?.toISOString() ?? "",
    Returned: b.returnedAt?.toISOString() ?? "",
  }));

  return respondReport(c, "Borrow Report",
    ["ID", "User", "Email", "Book", "ISBN", "Quantity", "Status", "Borrowed", "Due", "Returned"],
    rows,
    [60, 70, 90, 100, 70, 25, 50, 80, 80, 80],
    "borrows-report",
  );
});

reportRoutes.get("/fines", authenticate, authorize("admin"), async (c: Context) => {
  const from = parseDateParam(c.req.query("from"), "from");
  const to = parseDateParam(c.req.query("to"), "to");

  const filter: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = from;
    if (to) dateFilter.$lte = to;
    filter.createdAt = dateFilter;
  }

  const fines = await Fine.find(filter)
    .populate("user", "name email")
    .populate({ path: "borrow", populate: { path: "book", select: "title isbn" } })
    .sort({ createdAt: -1 })
    .lean();

  const rows = fines.map((f) => ({ 
    ID: f._id.toString(),
    User: populated<{ name: string }>(f.user)?.name ?? "",
    Email: populated<{ email: string }>(f.user)?.email ?? "",
    Amount: f.amount,
    Reason: f.reason,
    Paid: f.paid ? "Yes" : "No",
    PaidAt: f.paidAt?.toISOString() ?? "",
    Created: f.createdAt?.toISOString() ?? "",
  }));

  return respondReport(c, "Fines Report",
    ["ID", "User", "Email", "Amount", "Reason", "Paid", "PaidAt", "Created"],
    rows,
    [60, 70, 90, 50, 150, 40, 80, 80],
    "fines-report",
  );
});

reportRoutes.get("/books", authenticate, authorize("admin"), async (c: Context) => {
  const books = await Book.find()
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .lean();

  const rows = books.map((b) => ({
    ID: b._id.toString(),
    Title: b.title,
    Author: populated<{ name: string }>(b.author)?.name ?? "",
    ISBN: b.isbn,
    Genre: b.genre,
    Copies: b.copies,
    Available: b.availableCopies,
    AvgRating: b.avgRating?.toFixed(1) ?? "0.0",
    ReviewCount: b.reviewCount ?? 0,
  }));

  return respondReport(c, "Books Report",
    ["ID", "Title", "Author", "ISBN", "Genre", "Copies", "Available", "AvgRating", "ReviewCount"],
    rows,
    [60, 120, 80, 70, 60, 40, 40, 40, 45],
    "books-report",
  );
});

reportRoutes.get("/popular", authenticate, authorize("admin"), async (c: Context) => {
  const popular = await Borrow.aggregate([
    { $group: { _id: "$book", borrowCount: { $sum: 1 } } },
    { $sort: { borrowCount: -1 } },
    { $limit: 20 },
    { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
    { $unwind: "$book" },
    { $project: { title: "$book.title", isbn: "$book.isbn", author: "$book.author", genre: "$book.genre", borrowCount: 1 } },
  ]);

  const rows = popular.map((b) => ({
    Title: b.title,
    ISBN: b.isbn,
    Genre: b.genre,
    BorrowCount: b.borrowCount,
  }));

  return respondReport(c, "Popular Books Report",
    ["#", "Title", "ISBN", "Genre", "Borrow Count"],
    rows.map((r, i) => ({ "#": i + 1, ...r })),
    [20, 120, 70, 60, 50],
    "popular-books-report",
    { layout: "portrait", fontSize: 10 },
  );
});

export default reportRoutes;
