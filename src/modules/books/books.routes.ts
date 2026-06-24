import { Hono } from "hono";
import * as bookController from "./books.controller";
import { authenticate, authorize } from "../../middleware";

const bookRoutes = new Hono();

bookRoutes.get("/", bookController.getBooks);
bookRoutes.get("/:bookId", bookController.getBookById);
bookRoutes.post("/", authenticate, authorize("admin", "librarian"), bookController.createBook);
bookRoutes.put("/:bookId", authenticate, authorize("admin", "librarian"), bookController.updateBook);
bookRoutes.delete("/:bookId", authenticate, authorize("admin"), bookController.deleteBook);

export default bookRoutes;
