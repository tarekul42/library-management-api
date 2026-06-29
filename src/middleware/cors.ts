import type { Context, Next } from "hono";
import type { Env } from "../config/env";

function matchOrigin(requestOrigin: string | undefined, allowedOrigins: string[]): string | null {
  if (!requestOrigin) return null;
  for (const allowed of allowedOrigins) {
    if (allowed === "*") return requestOrigin;
    if (allowed === requestOrigin) return requestOrigin;
    if (allowed.startsWith("regex:") && new RegExp(allowed.slice(6)).test(requestOrigin)) {
      return requestOrigin;
    }
  }
  return null;
}

export async function corsMiddleware(c: Context, next: Next) {
  const env = c.get("env") as Env | undefined;
  const allowedOrigins = (env?.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim());
  const requestOrigin = c.req.header("origin");
  const matchedOrigin = matchOrigin(requestOrigin, allowedOrigins);

  if (matchedOrigin) {
    c.header("Access-Control-Allow-Origin", matchedOrigin);
  }
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true");

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  await next();
}
