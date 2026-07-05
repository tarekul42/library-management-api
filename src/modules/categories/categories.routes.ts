import { Hono } from "hono";
import { authenticate, authorize } from '../../middleware/index.js';
import * as categoryController from './categories.controller.js';

const categoryRoutes = new Hono();

categoryRoutes.get("/", categoryController.getAll);
categoryRoutes.get("/:id", categoryController.getById);
categoryRoutes.post("/", authenticate, authorize("admin"), categoryController.create);
categoryRoutes.put("/:id", authenticate, authorize("admin"), categoryController.update);
categoryRoutes.delete("/:id", authenticate, authorize("admin"), categoryController.remove);

export default categoryRoutes;
