import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../../schemas/auth.schema.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60,
};

export async function register(c: Context) {
  const body = await c.req.json();
  const input = registerSchema.parse(body);
  const result = await authService.register(input);
  setCookie(c, REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
  return c.json({
    success: true,
    message: "Registration successful",
    data: { user: result.user, accessToken: result.accessToken },
  }, 201);
}

export async function login(c: Context) {
  const body = await c.req.json();
  const input = loginSchema.parse(body);
  const result = await authService.login(input);
  setCookie(c, REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
  return c.json({
    success: true,
    message: "Login successful",
    data: { user: result.user, accessToken: result.accessToken },
  });
}

export async function refresh(c: Context) {
  const refreshToken = getCookie(c, REFRESH_COOKIE);
  if (!refreshToken) {
    return c.json({ success: false, message: "No refresh token" }, 401);
  }
  const result = await authService.refreshToken(refreshToken);
  setCookie(c, REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
  return c.json({
    success: true,
    message: "Token refreshed",
    data: { user: result.user, accessToken: result.accessToken },
  });
}

export async function logout(c: Context) {
  const refreshToken = getCookie(c, REFRESH_COOKIE);
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  deleteCookie(c, REFRESH_COOKIE);
  return c.json({ success: true, message: "Logged out successfully" });
}

export async function forgotPassword(c: Context) {
  const body = await c.req.json();
  const input = forgotPasswordSchema.parse(body);
  await authService.forgotPassword(input.email);
  return c.json({ success: true, message: "If that email is registered, a password reset link has been sent" });
}

export async function resetPassword(c: Context) {
  const body = await c.req.json();
  const input = resetPasswordSchema.parse(body);
  await authService.resetPassword(input.token, input.password);
  return c.json({ success: true, message: "Password reset successful" });
}
