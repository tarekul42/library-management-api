import { Hono } from "hono";
import { authenticate } from '../../middleware/index.js';
import * as reviewsController from './reviews.controller.js';

const reviewRoutes = new Hono();

reviewRoutes.get("/:bookId", reviewsController.getBookReviews);
reviewRoutes.post("/", authenticate, reviewsController.create);

export default reviewRoutes;
