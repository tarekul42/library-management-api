import { Hono } from "hono";
import { authenticate } from "../../middleware";
import * as reviewsController from "./reviews.controller";

const reviewRoutes = new Hono();

reviewRoutes.get("/:bookId", reviewsController.getBookReviews);
reviewRoutes.post("/", authenticate, reviewsController.create);

export default reviewRoutes;
