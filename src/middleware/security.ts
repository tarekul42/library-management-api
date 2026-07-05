import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter, MemoryStore } from "hono-rate-limiter";
import type { Context } from "hono";

const getClientIp = (c: Context) =>
  c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

export const compressionMiddleware = compress({
  threshold: 1024,
});

export const securityHeadersMiddleware = secureHeaders({
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  crossOriginResourcePolicy: "same-origin",
  crossOriginOpenerPolicy: "same-origin",
  strictTransportSecurity: "max-age=63072000; includeSubDomains",
  removePoweredBy: true,
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: [],
  },
});

export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-6",
  keyGenerator: getClientIp,
  message: { success: false, message: "Too many requests. Please try again later." },
  statusCode: 429,
  store: new MemoryStore(),
});

export const authRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-6",
  keyGenerator: getClientIp,
  message: { success: false, message: "Too many attempts. Please try again later." },
  statusCode: 429,
  store: new MemoryStore(),
  skip: (c: Context) => {
    const path = c.req.path;
    return !path.startsWith("/api/auth") && !path.startsWith("/api/v1/auth");
  },
});
