import { Hono } from "hono";
import type { Context } from "hono";
import { authenticate, authorize } from "../../middleware";
import { Author } from "../../models/author.model";
import { Book } from "../../models/book.model";
import { createAuthorSchema, updateAuthorSchema } from "../../schemas/author.schema";
import { AppError, NotFoundError } from "../../shared/errors";

const authorRoutes = new Hono();

authorRoutes.get("/", async (c: Context) => {
  const authors = await Author.find().sort({ name: 1 });
  return c.json({ success: true, message: "Authors retrieved", data: authors });
});

authorRoutes.get("/:id", async (c: Context) => {
  const author = await Author.findById(c.req.param("id"));
  if (!author) throw new NotFoundError("Author not found");
  return c.json({ success: true, message: "Author retrieved", data: author });
});

authorRoutes.get("/:id/books", async (c: Context) => {
  const books = await Book.find({ author: c.req.param("id") }).sort({ title: 1 });
  return c.json({ success: true, message: "Author books retrieved", data: books });
});

authorRoutes.post("/", authenticate, authorize("admin", "librarian"), async (c: Context) => {
  const body = await c.req.json();
  const input = createAuthorSchema.parse(body);
  const author = await Author.create(input);
  return c.json({ success: true, message: "Author created", data: author }, 201);
});

authorRoutes.put("/:id", authenticate, authorize("admin", "librarian"), async (c: Context) => {
  const body = await c.req.json();
  const input = updateAuthorSchema.parse(body);
  const author = await Author.findByIdAndUpdate(c.req.param("id"), input, { new: true });
  if (!author) throw new NotFoundError("Author not found");
  return c.json({ success: true, message: "Author updated", data: author });
});

authorRoutes.delete("/:id", authenticate, authorize("admin"), async (c: Context) => {
  const bookCount = await Book.countDocuments({ author: c.req.param("id") });
  if (bookCount > 0) {
    throw new AppError(`Cannot delete author: ${bookCount} book(s) still reference this author`, 400);
  }
  const author = await Author.findByIdAndDelete(c.req.param("id"));
  if (!author) throw new NotFoundError("Author not found");
  return c.json({ success: true, message: "Author deleted", data: null });
});

export default authorRoutes;
