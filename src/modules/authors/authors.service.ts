import { Author } from '../../models/author.model.js';
import { Book } from '../../models/book.model.js';
import { AppError, NotFoundError } from '../../shared/errors.js';
import { findByIdOrThrow } from '../../shared/utils.js';
import type { CreateAuthorInput, UpdateAuthorInput } from '../../schemas/author.schema.js';
import { paginate } from '../../shared/pagination.js';

export async function getAll(page: number, limit: number) {
  return paginate(Author, {}, { page, limit, sort: { name: 1 } });
}

export async function getById(id: string) {
  return findByIdOrThrow(Author, id, "Author not found");
}

export async function getBooks(id: string) {
  await findByIdOrThrow(Author, id, "Author not found");
  return Book.find({ author: id }).sort({ title: 1 });
}

export async function create(input: CreateAuthorInput) {
  return Author.create(input);
}

export async function update(id: string, input: UpdateAuthorInput) {
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
