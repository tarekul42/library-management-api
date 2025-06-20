import { Router } from "express";
import { bookController } from "./book.controller";

const bookRoute = Router();

bookRoute.get("/", bookController.getBooks);
bookRoute.get("/:bookId", bookController.getBookById);
bookRoute.post("/", bookController.createBook);
bookRoute.put("/:bookId", bookController.updateBook);

export default bookRoute;
