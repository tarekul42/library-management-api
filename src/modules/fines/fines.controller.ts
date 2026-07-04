import type { Context } from "hono";
import { z } from "zod";
import * as finesService from './fines.service.js';

const fineQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["paid", "unpaid"]).optional(),
});

export async function getMyFines(c: Context) {
  const userId = c.get("userId");
  const query = fineQuerySchema.parse(c.req.query());
  const result = await finesService.getMyFines(userId, query);
  return c.json({ success: true, message: "Fines retrieved", ...result });
}

export async function getAll(c: Context) {
  const query = fineQuerySchema.parse(c.req.query());
  const result = await finesService.getAll(query);
  return c.json({ success: true, message: "Fines retrieved", ...result });
}

export async function pay(c: Context) {
  const userId = c.get("userId");
  const fineId = c.req.param("id") ?? "";
  const data = await finesService.payFine(fineId, userId);
  return c.json({ success: true, message: "Fine paid", data });
}
