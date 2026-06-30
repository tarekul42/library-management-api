import { Hono } from "hono";
import { authenticate, authorize } from "../../middleware";
import * as reservationController from "./reservations.controller";

const reservationRoutes = new Hono();

reservationRoutes.get("/", authenticate, reservationController.getMyReservations);
reservationRoutes.post("/", authenticate, reservationController.create);
reservationRoutes.delete("/:id", authenticate, reservationController.remove);
reservationRoutes.put("/:id/fulfill", authenticate, authorize("admin", "librarian"), reservationController.fulfill);

export default reservationRoutes;
