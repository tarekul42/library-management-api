import type { Context, Next } from "hono";
import { getLogger } from '../config/index.js';

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  getLogger().info({ method, path, status, durationMs: duration }, `${method} ${path} ${status} ${duration}ms`);
}
