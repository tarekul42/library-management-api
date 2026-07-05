import type { Context } from "hono";
import { createBorrowSchema, borrowQuerySchema } from '../../schemas/borrow.schema.js';
import { ForbiddenError, ValidationError } from '../../shared/errors.js';
import * as borrowService from './borrow.service.js';

export async function create(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createBorrowSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const input = parsed.data;
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
  const parsed = borrowQuerySchema.safeParse(c.req.query());
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const query = parsed.data;
  const result = await borrowService.getUserBorrows(userId, query);
  return c.json({ success: true, message: "Borrows retrieved", ...result });
}

export async function getAll(c: Context) {
  const parsed = borrowQuerySchema.safeParse(c.req.query());
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.issues);
  const query = parsed.data;
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

export async function renew(c: Context) {
  const userId = c.get("userId");
  const userRole = c.get("userRole");
  const id = c.req.param("id") ?? "";
  const data = await borrowService.renewBorrow(id, userId, userRole);
  return c.json({ success: true, message: "Borrow renewed successfully", data });
}

export async function getById(c: Context) {
  const borrowId = c.req.param("id") ?? "";
  const userId = c.get("userId");
  const userRole = c.get("userRole");
  const data = await borrowService.getBorrowById(borrowId);
  const borrowerId = data.user?._id?.toString();
  if (borrowerId !== userId && userRole !== "admin") {
    throw new ForbiddenError("Forbidden");
  }
  return c.json({ success: true, message: "Borrow retrieved", data });
}
