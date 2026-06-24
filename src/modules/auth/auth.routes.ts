import { Hono } from "hono";
import * as authController from "./auth.controller";

const authRoutes = new Hono();

authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);

export default authRoutes;
