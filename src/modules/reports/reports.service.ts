import { Borrow } from '../../models/borrow.model.js';
import { Fine } from '../../models/fine.model.js';
import { Book } from '../../models/book.model.js';
import { AppError } from '../../shared/errors.js';
import { generatePDF } from '../../shared/pdf.js';

function parseDateParam(value: unknown, label: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value as string);
  if (isNaN(date.getTime())) throw new AppError(`Invalid ${label} date parameter`, 400);
  return date;
}

function csvSerialize(rows: Record<string, unknown>[], columns: string[]): string {
  if (rows.length === 0) return "";
  const header = columns.join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const val = String(row[col] ?? "");
          const escaped = val.replace(/"/g, '""');
          const sanitized = escaped.replace(/^[=+\-@]/, "'$&");
          return `"${sanitized}"`;
        })
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

async function buildQuery(model: string, queryParams: Record<string, string | undefined>) {
  const from = parseDateParam(queryParams.from, "from");
  const to = parseDateParam(queryParams.to, "to");
  const status = queryParams.status;
  const format = queryParams.format === "pdf" ? "pdf" : "csv";
  const filter: Record<string, unknown> = {};

  if (model === "borrow") {
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) (filter.createdAt as Record<string, Date>).$gte = from;
      if (to) (filter.createdAt as Record<string, Date>).$lte = to;
    }
  }

  if (model === "fine") {
    if (status === "paid") filter.paid = true;
    if (status === "unpaid") filter.paid = false;
    if (from || to) {
      filter.createdAt = {};
      if (from) (filter.createdAt as Record<string, Date>).$gte = from;
      if (to) (filter.createdAt as Record<string, Date>).$lte = to;
    }
  }

  return { filter, format };
}

export async function generateBorrowReport(queryParams: Record<string, string | undefined>) {
  const { filter, format } = await buildQuery("borrow", queryParams);
  const borrows = await Borrow.find(filter)
    .populate("user", "name email")
    .populate("book", "title isbn")
    .sort({ createdAt: -1 });

  const columns = ["User", "Email", "Book", "ISBN", "Status", "Borrowed At", "Due Date", "Returned At"];
  const rows = borrows.map((b) => ({
    User: (b.user as { name?: string })?.name ?? "N/A",
    Email: (b.user as { email?: string })?.email ?? "",
    Book: (b.book as { title?: string })?.title ?? "N/A",
    ISBN: (b.book as { isbn?: string })?.isbn ?? "",
    Status: b.status,
    "Borrowed At": b.createdAt.toISOString(),
    "Due Date": b.dueDate.toISOString(),
    "Returned At": b.returnedAt?.toISOString() ?? "",
  }));

  const filename = `borrows-report.${format}`;
  if (format === "csv") return { format, filename, content: csvSerialize(rows, columns) };

  const pdfBuffer = await generatePDF("Library Borrow Report", columns, rows, filename);
  return { format, filename, content: pdfBuffer };
}

export async function generateFinesReport(queryParams: Record<string, string | undefined>) {
  const { filter, format } = await buildQuery("fine", queryParams);
  const fines = await Fine.find(filter)
    .populate("user", "name email")
    .populate({ path: "borrow", populate: { path: "book", select: "title" } });

  const columns = ["User", "Email", "Book", "Amount", "Paid", "Reason", "Date"];
  interface PopulatedBorrow {
    book?: { title?: string };
  }
  const rows = fines.map((f) => ({
    User: (f.user as { name?: string })?.name ?? "N/A",
    Email: (f.user as { email?: string })?.email ?? "",
    Book: ((f.borrow as PopulatedBorrow)?.book as { title?: string })?.title ?? "N/A",
    Amount: f.amount.toString(),
    Paid: f.paid ? "Yes" : "No",
    Reason: f.reason,
    Date: f.createdAt.toISOString(),
  }));

  const filename = `fines-report.${format}`;
  if (format === "csv") return { format, filename, content: csvSerialize(rows, columns) };

  const pdfBuffer = await generatePDF("Library Fines Report", columns, rows, filename);
  return { format, filename, content: pdfBuffer };
}

export async function generateBooksReport(queryParams: Record<string, string | undefined>) {
  const books = await Book.find().populate("author", "name").sort({ title: 1 });

  const columns = ["Title", "Author", "ISBN", "Genre", "Copies", "Available", "Rating"];
  const rows = books.map((b) => ({
    Title: b.title,
    Author: (b.author as { name?: string })?.name ?? "N/A",
    ISBN: b.isbn,
    Genre: b.genre,
    Copies: b.copies.toString(),
    Available: b.availableCopies.toString(),
    Rating: b.avgRating.toFixed(1),
  }));

  const format = queryParams.format === "pdf" ? "pdf" : "csv";
  const filename = `books-report.${format}`;
  if (format === "csv") return { format, filename, content: csvSerialize(rows, columns) };

  const pdfBuffer = await generatePDF("Library Books Report", columns, rows, filename);
  return { format, filename, content: pdfBuffer };
}

export async function generatePopularReport(queryParams: Record<string, string | undefined>) {
  const popular = await Borrow.aggregate([
    { $group: { _id: "$book", borrowCount: { $sum: 1 } } },
    { $sort: { borrowCount: -1 } },
    { $limit: 20 },
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
        title: "$book.title",
        author: "$book.author",
        borrowCount: 1,
      },
    },
  ]);

  await Book.populate(popular, { path: "author", select: "name" });

  const columns = ["Title", "Author", "Times Borrowed"];
  const rows = popular.map((b) => ({
    Title: b.title,
    Author: (b.author as { name?: string })?.name ?? "N/A",
    "Times Borrowed": b.borrowCount.toString(),
  }));

  const format = queryParams.format === "pdf" ? "pdf" : "csv";
  const filename = `popular-books-report.${format}`;
  if (format === "csv") return { format, filename, content: csvSerialize(rows, columns) };

  const pdfBuffer = await generatePDF("Popular Books Report", columns, rows, filename);
  return { format, filename, content: pdfBuffer };
}
