import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { User, type IUserDocument } from "../../models/user.model";
import { getEnv, type Env } from "../../config";
import { AppError } from "../../shared/errors";
import type { RegisterInput, LoginInput } from "../../schemas/auth.schema";

const tokenBlacklist = new Set<string>();

function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

function addToBlacklist(token: string): void {
  tokenBlacklist.add(token);
  setTimeout(() => tokenBlacklist.delete(token), 7 * 24 * 60 * 60 * 1000);
}

function generateTokens(user: IUserDocument, env: Env) {
  const accessToken = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] },
  );

  const refreshToken = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] },
  );

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const env = getEnv();

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  const tokens = generateTokens(user, env);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function login(input: LoginInput) {
  const env = getEnv();

  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = generateTokens(user, env);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function refreshToken(token: string) {
  const env = getEnv();

  if (isTokenBlacklisted(token)) {
    throw new AppError("Refresh token has been revoked", 401);
  }

  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: string;
      role: string;
    };
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AppError("Invalid refresh token", 401);
    }

    addToBlacklist(token);
    const tokens = generateTokens(user, env);
    return tokens;
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
}

export async function logout(token: string) {
  addToBlacklist(token);
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email });
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = await bcrypt.hash(resetToken, 10);

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
}

export async function resetPassword(token: string, password: string) {
  const users = await User.find({
    resetPasswordExpires: { $gt: new Date() },
    resetPasswordToken: { $ne: null },
  }).select("+resetPasswordToken");

  let matchedUser: IUserDocument | null = null;
  for (const u of users) {
    if (u.resetPasswordToken && (await bcrypt.compare(token, u.resetPasswordToken))) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  matchedUser.password = hashedPassword;
  matchedUser.resetPasswordToken = undefined;
  matchedUser.resetPasswordExpires = undefined;
  await matchedUser.save();
}
