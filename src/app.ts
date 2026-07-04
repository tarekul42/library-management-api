import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
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

app.use("*", bodyLimit({ maxSize: 1024 * 1024 }));
app.use("*", corsMiddleware);
app.use("*", securityHeadersMiddleware);
app.use("*", compressionMiddleware);
app.use("*", apiRateLimiter);
app.use("/api/auth/*", authRateLimiter);
app.use("/api/v1/auth/*", authRateLimiter);
app.use("*", requestLogger);

app.get("/", (c) =>
  c.json({ success: true, message: "Welcome to Library Management API!" }),
);

const apiRoot = new Hono();

apiRoot.route("/auth", authRoutes);
apiRoot.route("/users", userRoutes);
apiRoot.route("/books", bookRoutes);
apiRoot.route("/borrow", borrowRoutes);
apiRoot.route("/authors", authorRoutes);
apiRoot.route("/categories", categoryRoutes);
apiRoot.route("/fines", fineRoutes);
apiRoot.route("/reviews", reviewRoutes);
apiRoot.route("/notifications", notificationRoutes);
apiRoot.route("/dashboard", dashboardRoutes);
apiRoot.route("/uploads", uploadRoutes);
apiRoot.route("/wishlist", wishlistRoutes);
apiRoot.route("/reservations", reservationRoutes);
apiRoot.route("/reports", reportRoutes);

apiRoot.get("/health", (c) =>
  c.json({
    success: true,
    message: "OK",
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  }),
);

app.route("/api", apiRoot);
app.route("/api/v1", apiRoot);

app.onError(errorHandler);
app.notFound(notFoundHandler);

export default app;
