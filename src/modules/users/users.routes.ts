import { Hono } from "hono";
import { authenticate, authorize } from '../../middleware/index.js';
import * as userController from './users.controller.js';

const userRoutes = new Hono();

userRoutes.get("/me", authenticate, userController.getMe);
userRoutes.put("/me", authenticate, userController.updateMe);
userRoutes.get("/me/history", authenticate, userController.getMyHistory);
userRoutes.get("/", authenticate, authorize("admin"), userController.getAll);
userRoutes.get("/:id", authenticate, authorize("admin"), userController.getById);
userRoutes.put("/:id", authenticate, authorize("admin"), userController.updateById);

export default userRoutes;
