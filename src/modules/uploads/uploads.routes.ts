import { Hono } from "hono";
import { authenticate, authorize } from '../../middleware/index.js';
import * as uploadController from './uploads.controller.js';

const uploadRoutes = new Hono();

uploadRoutes.post("/", authenticate, authorize("admin", "librarian"), uploadController.upload);

export default uploadRoutes;
