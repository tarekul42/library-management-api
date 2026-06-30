import { Hono } from "hono";
import { authenticate, authorize } from '../../middleware/index.js';
import * as reportController from './reports.controller.js';

const reportRoutes = new Hono();

reportRoutes.get("/borrows", authenticate, authorize("admin"), reportController.borrowReport);
reportRoutes.get("/fines", authenticate, authorize("admin"), reportController.finesReport);
reportRoutes.get("/books", authenticate, authorize("admin"), reportController.booksReport);
reportRoutes.get("/popular", authenticate, authorize("admin"), reportController.popularReport);

export default reportRoutes;
