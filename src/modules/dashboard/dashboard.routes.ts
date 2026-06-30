import { Hono } from "hono";
import { authenticate, authorize } from "../../middleware";
import * as dashboardController from "./dashboard.controller";

const dashboardRoutes = new Hono();

dashboardRoutes.get("/stats", authenticate, authorize("admin"), dashboardController.getStats);
dashboardRoutes.get("/popular", authenticate, authorize("admin"), dashboardController.getPopularBooks);
dashboardRoutes.get("/trends", authenticate, authorize("admin"), dashboardController.getTrends);
dashboardRoutes.get("/genre-distribution", authenticate, authorize("admin"), dashboardController.getGenreDistribution);

export default dashboardRoutes;
