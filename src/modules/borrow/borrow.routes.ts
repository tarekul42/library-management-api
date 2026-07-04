import { Hono } from "hono";
import { authenticate, authorize } from '../../middleware/index.js';
import * as borrowController from './borrow.controller.js';

const borrowRoutes = new Hono();

borrowRoutes.post("/", authenticate, borrowController.create);
borrowRoutes.put("/:id/return", authenticate, borrowController.returnBook);
borrowRoutes.put("/:id/renew", authenticate, borrowController.renew);
borrowRoutes.get("/me", authenticate, borrowController.getMyBorrows);
borrowRoutes.get("/", authenticate, authorize("admin"), borrowController.getAll);
borrowRoutes.get("/active", authenticate, authorize("admin"), borrowController.getActive);
borrowRoutes.get("/overdue", authenticate, authorize("admin"), borrowController.getOverdue);
borrowRoutes.get("/:id", authenticate, borrowController.getById);

export default borrowRoutes;
