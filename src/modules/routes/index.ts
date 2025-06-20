import { Router } from "express";
import bookRoute from "../book/book.route";
import borrowRoute from "../borrow/borrow.route";
import userRoute from "../user/user.route";

const routes = Router();

routes.use("/api/books", bookRoute);
routes.use("/api/users", userRoute);
routes.use("/api/borrow", borrowRoute);

export default routes;
