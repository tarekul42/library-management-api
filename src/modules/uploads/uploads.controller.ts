import type { Context } from "hono";
import { AppError } from '../../shared/errors.js';
import * as uploadService from './uploads.service.js';

export async function upload(c: Context) {
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!(file instanceof File)) {
    throw new AppError("No file provided", 400);
  }

  const result = await uploadService.uploadFile(file);
  return c.json({ success: true, data: result });
}
