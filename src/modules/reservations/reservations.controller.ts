import type { Context } from "hono";
import { z } from "zod";
import { ValidationError } from '../../shared/errors.js';
import * as reservationService from './reservations.service.js';

const createReservationSchema = z.object({
  book: z.string().min(1),
});

export async function getMyReservations(c: Context) {
  const userId = c.get("userId");
  const data = await reservationService.getMyReservations(userId);
  return c.json({ success: true, message: "Reservations retrieved", data });
}

export async function create(c: Context) {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.flatten());
  const data = await reservationService.createReservation(userId, parsed.data.book);
  return c.json({ success: true, message: "Reservation created", data }, 201);
}

export async function remove(c: Context) {
  const userId = c.get("userId");
  const id = c.req.param("id") ?? "";
  await reservationService.cancelReservation(id, userId);
  return c.json({ success: true, message: "Reservation cancelled", data: null });
}

export async function fulfill(c: Context) {
  const id = c.req.param("id") ?? "";
  const data = await reservationService.fulfillReservation(id);
  return c.json({ success: true, message: "Reservation fulfilled", data });
}
