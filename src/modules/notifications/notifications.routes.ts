import { Hono } from "hono";
import { authenticate } from '../../middleware/index.js';
import * as notificationController from './notifications.controller.js';

const notificationRoutes = new Hono();

notificationRoutes.get("/", authenticate, notificationController.getMyNotifications);
notificationRoutes.put("/:id/read", authenticate, notificationController.markRead);
notificationRoutes.put("/read-all", authenticate, notificationController.markAllRead);

export default notificationRoutes;
