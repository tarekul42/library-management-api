import type { Context } from "hono";
import * as reportService from "./reports.service";

export async function borrowReport(c: Context) {
  const result = await reportService.generateBorrowReport(c.req.query());
  return sendReport(c, result);
}

export async function finesReport(c: Context) {
  const result = await reportService.generateFinesReport(c.req.query());
  return sendReport(c, result);
}

export async function booksReport(c: Context) {
  const result = await reportService.generateBooksReport(c.req.query());
  return sendReport(c, result);
}

export async function popularReport(c: Context) {
  const result = await reportService.generatePopularReport(c.req.query());
  return sendReport(c, result);
}

async function sendReport(c: Context, result: { format: string; filename: string; content: string | Buffer }) {
  if (result.format === "csv") {
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${result.filename}"`);
    return c.newResponse(result.content as string);
  }

  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", `attachment; filename="${result.filename}"`);
  return c.newResponse(new Uint8Array(result.content as Buffer));
}
