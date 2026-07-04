import { Hono } from "hono";
import { authenticate } from '../../middleware/index.js';
import * as authController from './auth.controller.js';

const authRoutes = new Hono();

authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.put("/change-password", authenticate, authController.changePassword);
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/reset-password", authController.resetPassword);

export default authRoutes;
