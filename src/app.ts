import { Hono } from "hono";
import { corsMiddleware, requestLogger } from "./middleware";
import { errorHandler, notFoundHandler } from "./shared/errors";
import { loadEnv, type Env } from "./config";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import bookRoutes from "./modules/books/books.routes";
import borrowRoutes from "./modules/borrow/borrow.routes";
import authorRoutes from "./modules/authors/authors.routes";
import categoryRoutes from "./modules/categories/categories.routes";
import fineRoutes from "./modules/fines/fines.routes";
import reviewRoutes from "./modules/reviews/reviews.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import uploadRoutes from "./modules/uploads/uploads.routes";
import wishlistRoutes from "./modules/wishlist/wishlist.routes";
import reservationRoutes from "./modules/reservations/reservations.routes";
import reportRoutes from "./modules/reports/reports.routes";

const app = new Hono<{ Variables: { userId: string; userRole: string; env: Env } }>();

const env = loadEnv();
app.use("*", (c, next) => {
  c.set("env", env);
  return next();
});

app.use("*", corsMiddleware);
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
