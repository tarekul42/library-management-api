import { Hono } from "hono";
import { authenticate } from "../../middleware";
import * as wishlistController from "./wishlist.controller";

const wishlistRoutes = new Hono();

wishlistRoutes.get("/", authenticate, wishlistController.getMyWishlist);
wishlistRoutes.post("/", authenticate, wishlistController.add);
wishlistRoutes.delete("/:bookId", authenticate, wishlistController.remove);

export default wishlistRoutes;
