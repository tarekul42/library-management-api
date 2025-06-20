import { Router } from "express";
import { bookController } from "./book.controller";

const bookRoute = Router();

bookRoute.get("/", bookController.getBooks);
bookRoute.post("/", bookController.createBook);

export default bookRoute;
