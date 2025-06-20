import { Router } from "express";
import { userController } from "./user.controller";

const userRoute = Router();

userRoute.post("/", userController.registerUser);
userRoute.get("/", userController.getUsers);

export default userRoute;