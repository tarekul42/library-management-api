import { Hono } from "hono";
import { authenticate } from '../../middleware/index.js';
import * as wishlistController from './wishlist.controller.js';

const wishlistRoutes = new Hono();

wishlistRoutes.get("/", authenticate, wishlistController.getMyWishlist);
wishlistRoutes.post("/", authenticate, wishlistController.add);
wishlistRoutes.delete("/:bookId", authenticate, wishlistController.remove);

export default wishlistRoutes;
