import type { Context } from "hono";
import { registerSchema, loginSchema } from "../../schemas/auth.schema";
import * as authService from "./auth.service";

export async function register(c: Context) {
  const body = await c.req.json();
  const input = registerSchema.parse(body);
  const result = await authService.register(input);
  return c.json({ success: true, message: "Registration successful", data: result }, 201);
}

export async function login(c: Context) {
  const body = await c.req.json();
  const input = loginSchema.parse(body);
  const result = await authService.login(input);
  return c.json({ success: true, message: "Login successful", data: result });
}

export async function refresh(c: Context) {
  const body = await c.req.json();
  const result = await authService.refreshToken(body.refreshToken);
  return c.json({ success: true, message: "Token refreshed", data: result });
}

export async function logout(c: Context) {
  return c.json({ success: true, message: "Logged out successfully" });
}
