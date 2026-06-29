import { Hono } from "hono";
import type { Context } from "hono";
import PDFDocument from "pdfkit";
import { authenticate, authorize } from "../../middleware";
import { Borrow } from "../../models/borrow.model";
import { Fine } from "../../models/fine.model";
import { Book } from "../../models/book.model";
import { AppError } from "../../shared/errors";

const reportRoutes = new Hono();

function csvSerialize(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.map((h) => esc(h)).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
}

function setCSVHeaders(c: Context, filename: string): void {
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="${filename}.csv"`);
}

reportRoutes.get("/borrows", authenticate, authorize("admin"), async (c: Context) => {
  const format = c.req.query("format") || "csv";
  const from = c.req.query("from");
  const to = c.req.query("to");
  const status = c.req.query("status");

  const filter: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
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
    User: (b.user as unknown as { name?: string; email?: string })?.name ?? "",
    Email: (b.user as unknown as { name?: string; email?: string })?.email ?? "",
    Book: (b.book as unknown as { title?: string })?.title ?? "",
    ISBN: (b.book as unknown as { isbn?: string })?.isbn ?? "",
    Quantity: b.quantity,
    Status: b.status,
    Borrowed: b.borrowedAt?.toISOString() ?? "",
    Due: b.dueDate?.toISOString() ?? "",
    Returned: b.returnedAt?.toISOString() ?? "",
  }));

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => {});

    doc.fontSize(16).text("Borrow Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(8);

    const headers: (keyof typeof rows[number])[] = ["ID", "User", "Email", "Book", "ISBN", "Quantity", "Status", "Borrowed", "Due", "Returned"];
    const colWidths = [60, 70, 90, 100, 70, 25, 50, 80, 80, 80];

    let y = doc.y;
    const left = 30;
    headers.forEach((h, i) => {
      doc.font("Helvetica-Bold").text(h, left + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
    });
    y += 14;
    doc.font("Helvetica");

    for (const row of rows) {
      if (y > 550) { doc.addPage(); y = 30; }
      headers.forEach((h, i) => {
        doc.text(String(row[h] ?? ""), left + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
      });
      y += 12;
    }

    doc.end();
    const pdf = Buffer.concat(buffers);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", 'attachment; filename="borrows-report.pdf"');
    return c.newResponse(pdf);
  }

  setCSVHeaders(c, "borrows-report");
  return c.newResponse(csvSerialize(rows));
});

reportRoutes.get("/fines", authenticate, authorize("admin"), async (c: Context) => {
  const format = c.req.query("format") || "csv";
  const from = c.req.query("from");
  const to = c.req.query("to");

  const filter: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    filter.createdAt = dateFilter;
  }

  const fines = await Fine.find(filter)
    .populate("user", "name email")
    .populate({ path: "borrow", populate: { path: "book", select: "title isbn" } })
    .sort({ createdAt: -1 })
    .lean();

  const rows = fines.map((f) => ({
    ID: f._id.toString(),
    User: (f.user as unknown as { name?: string })?.name ?? "",
    Email: (f.user as unknown as { email?: string })?.email ?? "",
    Amount: f.amount,
    Reason: f.reason,
    Paid: f.paid ? "Yes" : "No",
    PaidAt: f.paidAt?.toISOString() ?? "",
    Created: f.createdAt?.toISOString() ?? "",
  }));

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    doc.fontSize(16).text("Fines Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(9);

    const headers: (keyof typeof rows[number])[] = ["ID", "User", "Email", "Amount", "Reason", "Paid", "PaidAt", "Created"];
    const colWidths = [60, 70, 90, 50, 150, 40, 80, 80];
    let y = doc.y;
    const left = 30;

    headers.forEach((h, i) => {
      doc.font("Helvetica-Bold").text(h, left + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
    });
    y += 14;
    doc.font("Helvetica");

    for (const row of rows) {
      if (y > 550) { doc.addPage(); y = 30; }
      headers.forEach((h, i) => {
        doc.text(String(row[h] ?? ""), left + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
      });
      y += 12;
    }

    doc.end();
    const pdf = Buffer.concat(buffers);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", 'attachment; filename="fines-report.pdf"');
    return c.newResponse(pdf);
  }

  setCSVHeaders(c, "fines-report");
  return c.newResponse(csvSerialize(rows));
});

reportRoutes.get("/books", authenticate, authorize("admin"), async (c: Context) => {
  const format = c.req.query("format") || "csv";

  const books = await Book.find()
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .lean();

  const rows = books.map((b) => ({
    ID: b._id.toString(),
    Title: b.title,
    Author: (b.author as unknown as { name?: string })?.name ?? "",
    ISBN: b.isbn,
    Genre: b.genre,
    Copies: b.copies,
    Available: b.availableCopies,
    AvgRating: b.avgRating?.toFixed(1) ?? "0.0",
    ReviewCount: b.reviewCount ?? 0,
  }));

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    doc.fontSize(16).text("Books Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(8);

    const headers: (keyof typeof rows[number])[] = ["ID", "Title", "Author", "ISBN", "Genre", "Copies", "Available", "AvgRating", "ReviewCount"];
    const colWidths = [60, 120, 80, 70, 60, 40, 40, 40, 45];
    let y = doc.y;
    const left = 30;

    headers.forEach((h, i) => {
      doc.font("Helvetica-Bold").text(h, left + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
    });
    y += 14;
    doc.font("Helvetica");

    for (const row of rows) {
      if (y > 550) { doc.addPage(); y = 30; }
      headers.forEach((h, i) => {
        doc.text(String(row[h] ?? ""), left + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
      });
      y += 12;
    }

    doc.end();
    const pdf = Buffer.concat(buffers);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", 'attachment; filename="books-report.pdf"');
    return c.newResponse(pdf);
  }

  setCSVHeaders(c, "books-report");
  return c.newResponse(csvSerialize(rows));
});

reportRoutes.get("/popular", authenticate, authorize("admin"), async (c: Context) => {
  const format = c.req.query("format") || "csv";

  const popular = await Borrow.aggregate([
    { $group: { _id: "$book", borrowCount: { $sum: 1 } } },
    { $sort: { borrowCount: -1 } },
    { $limit: 20 },
    {
      $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" },
    },
    { $unwind: "$book" },
    { $project: { title: "$book.title", isbn: "$book.isbn", author: "$book.author", genre: "$book.genre", borrowCount: 1 } },
  ]);

  const rows = popular.map((b) => ({
    Title: b.title,
    ISBN: b.isbn,
    Genre: b.genre,
    BorrowCount: b.borrowCount,
  }));

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    doc.fontSize(16).text("Popular Books Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10);

    rows.forEach((row, i) => {
      doc.text(`${i + 1}. "${row.Title}" — ${row.BorrowCount} borrow(s)`);
    });

    doc.end();
    const pdf = Buffer.concat(buffers);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", 'attachment; filename="popular-books-report.pdf"');
    return c.newResponse(pdf);
  }

  setCSVHeaders(c, "popular-books-report");
  return c.newResponse(csvSerialize(rows));
});

export default reportRoutes;
