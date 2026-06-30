import { Hono } from "hono";
import { authenticate, authorize } from "../../middleware";
import * as uploadController from "./uploads.controller";

const uploadRoutes = new Hono();

uploadRoutes.post("/", authenticate, authorize("admin", "librarian"), uploadController.upload);

export default uploadRoutes;
