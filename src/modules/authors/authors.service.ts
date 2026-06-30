import { Author } from "../../models/author.model";
import { Book } from "../../models/book.model";
import { AppError, NotFoundError } from "../../shared/errors";
import { findByIdOrThrow } from "../../shared/utils";

export async function getAll(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [authors, total] = await Promise.all([
    Author.find().sort({ name: 1 }).skip(skip).limit(limit),
    Author.countDocuments(),
  ]);
  return { data: authors, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getById(id: string) {
  return findByIdOrThrow(Author, id, "Author not found");
}

export async function getBooks(id: string) {
  await findByIdOrThrow(Author, id, "Author not found");
  return Book.find({ author: id }).sort({ title: 1 });
}

export async function create(input: Record<string, unknown>) {
  return Author.create(input);
}

export async function update(id: string, input: Record<string, unknown>) {
  const author = await Author.findByIdAndUpdate(id, input, { new: true });
  if (!author) throw new NotFoundError("Author not found");
  return author;
}

export async function remove(id: string) {
  const bookCount = await Book.countDocuments({ author: id });
  if (bookCount > 0) {
    throw new AppError(`Cannot delete author: ${bookCount} book(s) still reference this author`, 400);
  }
  const author = await Author.findByIdAndDelete(id);
  if (!author) throw new NotFoundError("Author not found");
}
