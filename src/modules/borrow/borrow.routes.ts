import { Hono } from "hono";
import { authenticate, authorize } from "../../middleware";
import * as borrowController from "./borrow.controller";

const borrowRoutes = new Hono();

borrowRoutes.post("/", authenticate, borrowController.create);
borrowRoutes.put("/:id/return", authenticate, borrowController.returnBook);
borrowRoutes.get("/me", authenticate, borrowController.getMyBorrows);
borrowRoutes.get("/", authenticate, authorize("admin"), borrowController.getAll);
borrowRoutes.get("/active", authenticate, authorize("admin"), borrowController.getActive);
borrowRoutes.get("/overdue", authenticate, authorize("admin"), borrowController.getOverdue);
borrowRoutes.get("/:id", authenticate, borrowController.getById);

export default borrowRoutes;
