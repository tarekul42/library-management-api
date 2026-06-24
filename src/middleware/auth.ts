import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../shared/errors";
import type { Env } from "../config/env";

interface JwtPayload {
  userId: string;
  role: string;
}

export async function authenticate(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("No token provided");
  }

  const token = authHeader.slice(7);
  const env = c.get("env") as Env;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    c.set("userId", payload.userId);
    c.set("userRole", payload.role);
    await next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function authorize(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get("userRole") as string | undefined;
    if (!userRole || !roles.includes(userRole)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    await next();
  };
}
