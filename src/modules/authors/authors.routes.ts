import { Hono } from "hono";
import { authenticate, authorize } from '../../middleware/index.js';
import * as authorController from './authors.controller.js';

const authorRoutes = new Hono();

authorRoutes.get("/", authorController.getAll);
authorRoutes.get("/:id", authorController.getById);
authorRoutes.get("/:id/books", authorController.getBooks);
authorRoutes.post("/", authenticate, authorize("admin", "librarian"), authorController.create);
authorRoutes.put("/:id", authenticate, authorize("admin", "librarian"), authorController.update);
authorRoutes.delete("/:id", authenticate, authorize("admin"), authorController.remove);

export default authorRoutes;
