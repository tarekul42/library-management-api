import { Router } from "express";
import bookRoute from "../book/book.route";

const routes = Router();

routes.use("/api/books", bookRoute)

export default routes;