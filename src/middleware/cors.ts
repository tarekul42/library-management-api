import type { Context, Next } from "hono";
import type { Env } from "../config/env";

export async function corsMiddleware(c: Context, next: Next) {
  const env = c.get("env") as Env | undefined;
  const origin = env?.CORS_ORIGIN || "http://localhost:5173";

  c.header("Access-Control-Allow-Origin", origin);
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true");

  if (c.req.method === "OPTIONS") {
    return c.text("", 204 as any);
  }

  await next();
}
