import type { Context } from "hono";
import { createBorrowSchema, borrowQuerySchema } from "../../schemas/borrow.schema";
import { ForbiddenError } from "../../shared/errors";
import * as borrowService from "./borrow.service";

export async function create(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = createBorrowSchema.parse(body);
  const data = await borrowService.createBorrow(userId, input);
  return c.json({ success: true, message: "Book borrowed successfully", data }, 201);
}

export async function returnBook(c: Context) {
  const userId = c.get("userId");
  const userRole = c.get("userRole");
  const id = c.req.param("id") ?? "";
  const data = await borrowService.returnBorrow(id, userId, userRole);
  return c.json({ success: true, message: "Book returned successfully", data });
}

export async function getMyBorrows(c: Context) {
  const userId = c.get("userId");
  const query = borrowQuerySchema.parse(c.req.query());
  const result = await borrowService.getUserBorrows(userId, query);
  return c.json({ success: true, message: "Borrows retrieved", ...result });
}

export async function getAll(c: Context) {
  const query = borrowQuerySchema.parse(c.req.query());
  const result = await borrowService.getAllBorrows(query);
  return c.json({ success: true, message: "Borrows retrieved", ...result });
}

export async function getActive(c: Context) {
  const data = await borrowService.getActiveBorrows();
  return c.json({ success: true, message: "Active borrows retrieved", data });
}

export async function getOverdue(c: Context) {
  const data = await borrowService.getOverdueBorrows();
  return c.json({ success: true, message: "Overdue borrows retrieved", data });
}

export async function getById(c: Context) {
  const borrowId = c.req.param("id") ?? "";
  const userId = c.get("userId");
  const userRole = c.get("userRole");
  const data = await borrowService.getBorrowById(borrowId);
  if (data.user._id.toString() !== userId && userRole !== "admin") {
    throw new ForbiddenError("Forbidden");
  }
  return c.json({ success: true, message: "Borrow retrieved", data });
}
