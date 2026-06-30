import type { Context } from "hono";
import * as finesService from "./fines.service";

export async function getMyFines(c: Context) {
  const userId = c.get("userId");
  const data = await finesService.getMyFines(userId);
  return c.json({ success: true, message: "Fines retrieved", data });
}

export async function getAll(c: Context) {
  const data = await finesService.getAll();
  return c.json({ success: true, message: "Fines retrieved", data });
}

export async function pay(c: Context) {
  const userId = c.get("userId");
  const fineId = c.req.param("id") ?? "";
  const data = await finesService.payFine(fineId, userId);
  return c.json({ success: true, message: "Fine paid", data });
}
