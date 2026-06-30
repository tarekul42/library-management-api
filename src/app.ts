import { Hono } from "hono";
import {
  corsMiddleware,
  requestLogger,
  compressionMiddleware,
  securityHeadersMiddleware,
  apiRateLimiter,
  authRateLimiter,
} from './middleware/index.js';
import { errorHandler, notFoundHandler } from './shared/errors.js';
import { loadEnv, type Env } from './config/index.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import bookRoutes from './modules/books/books.routes.js';
import borrowRoutes from './modules/borrow/borrow.routes.js';
import authorRoutes from './modules/authors/authors.routes.js';
import categoryRoutes from './modules/categories/categories.routes.js';
import fineRoutes from './modules/fines/fines.routes.js';
import reviewRoutes from './modules/reviews/reviews.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import uploadRoutes from './modules/uploads/uploads.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import reservationRoutes from './modules/reservations/reservations.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';

const app = new Hono<{ Variables: { userId: string; userRole: string; env: Env } }>();

const env = loadEnv();
app.use("*", (c, next) => {
  c.set("env", env);
  return next();
});

app.use("*", corsMiddleware);
app.use("*", securityHeadersMiddleware);
app.use("*", compressionMiddleware);
app.use("*", apiRateLimiter);
app.use("/api/auth/*", authRateLimiter);
app.use("*", requestLogger);

app.get("/", (c) =>
  c.json({ success: true, message: "Welcome to Library Management API!" }),
);

app.get("/api/health", (c) =>
  c.json({
    success: true,
    message: "OK",
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  }),
);

app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);
app.route("/api/books", bookRoutes);
app.route("/api/borrow", borrowRoutes);
app.route("/api/authors", authorRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/fines", fineRoutes);
app.route("/api/reviews", reviewRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/wishlist", wishlistRoutes);
app.route("/api/reservations", reservationRoutes);
app.route("/api/reports", reportRoutes);

app.onError(errorHandler);
app.notFound(notFoundHandler);

export default app;
