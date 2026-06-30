import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { User, type IUserDocument } from '../../models/user.model.js';
import { getEnv, logger, type Env } from '../../config/index.js';
import { AppError } from '../../shared/errors.js';
import type { RegisterInput, LoginInput } from '../../schemas/auth.schema.js';
import { getRedis } from '../../utils/redis.js';

function blacklistKey(token: string): string {
  return `token_blacklist:${token}`;
}

async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const exists = await redis.exists(blacklistKey(token));
    return exists === 1;
  } catch {
    logger.warn("Redis unavailable in isTokenBlacklisted — treating token as valid");
    return false;
  }
}

async function addToBlacklist(token: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(blacklistKey(token), "1", "EX", 7 * 24 * 60 * 60);
  } catch {
    logger.warn("Redis unavailable in addToBlacklist — token revocation skipped");
  }
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

  if (await isTokenBlacklisted(token)) {
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

    await addToBlacklist(token);
    const tokens = generateTokens(user, env);
    return {
      ...tokens,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    };
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
}

export async function logout(token: string) {
  await addToBlacklist(token);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email });
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(resetToken);

  user.resetPasswordToken = tokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
}
