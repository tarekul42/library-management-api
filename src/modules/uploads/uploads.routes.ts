import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { authenticate, authorize } from '../../middleware/index.js';
import * as uploadController from './uploads.controller.js';

const uploadRoutes = new Hono();

uploadRoutes.post(
  "/",
  bodyLimit({ maxSize: 6 * 1024 * 1024 }),
  authenticate,
  authorize("admin", "librarian"),
  uploadController.upload,
);

export default uploadRoutes;
