import type { Context } from "hono";
import { getLogger, getEnv } from '../config/index.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  public details: unknown;
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, 400);
    this.details = details;
  }
}

export async function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
        error: {
          code: err.statusCode,
          description: err.message,
          ...(err instanceof ValidationError && err.details
            ? { details: err.details }
            : {}),
        },
      },
      err.statusCode as Parameters<typeof c.json>[1],
    );
  }

  getLogger().error({ err }, "Unhandled error");
  return c.json(
    {
      success: false,
      message: "Internal server error",
      error: {
        code: 500,
        description:
          getEnv().NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
      },
    },
    500,
  );
}

export function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000;
}

export async function notFoundHandler(c: Context) {
  return c.json(
    {
      success: false,
      message: "Route not found",
      error: {
        code: 404,
        description: `Route ${c.req.method} ${c.req.url} not found`,
      },
    },
    404,
  );
}
