import { Hono } from "hono";
import { authenticate, authorize } from "../../middleware";
import * as finesController from "./fines.controller";

const fineRoutes = new Hono();

fineRoutes.get("/me", authenticate, finesController.getMyFines);
fineRoutes.get("/", authenticate, authorize("admin"), finesController.getAll);
fineRoutes.put("/:id/pay", authenticate, finesController.pay);

export default fineRoutes;
