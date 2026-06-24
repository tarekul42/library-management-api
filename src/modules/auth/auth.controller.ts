import type { Context } from "hono";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../../schemas/auth.schema";
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

export async function forgotPassword(c: Context) {
  const body = await c.req.json();
  const input = forgotPasswordSchema.parse(body);
  const result = await authService.forgotPassword(input.email);
  return c.json({ success: true, message: "Password reset email sent", data: result });
}

export async function resetPassword(c: Context) {
  const body = await c.req.json();
  const input = resetPasswordSchema.parse(body);
  await authService.resetPassword(input.token, input.password);
  return c.json({ success: true, message: "Password reset successful" });
}
