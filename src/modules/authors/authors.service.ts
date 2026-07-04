import { Author } from '../../models/author.model.js';
import { Book } from '../../models/book.model.js';
import { AppError, NotFoundError } from '../../shared/errors.js';
import { findByIdOrThrow } from '../../shared/utils.js';
import type { CreateAuthorInput, UpdateAuthorInput } from '../../schemas/author.schema.js';
import { paginate } from '../../shared/pagination.js';
import { getOrSet, invalidateCache, buildKey } from '../../utils/cache.js';

const AUTHOR_CACHE_ALL = buildKey("authors", "all");
const AUTHOR_CACHE_NS = buildKey("authors", "*");
const AUTHOR_CACHE_TTL = 300;

function authorCacheKey(id: string): string {
  return buildKey("authors", "id", id);
}

export async function getAll(page: number, limit: number) {
  const cacheKey = `${AUTHOR_CACHE_ALL}:${page}:${limit}`;
  return getOrSet(cacheKey, () => paginate(Author, {}, { page, limit, sort: { name: 1 } }), AUTHOR_CACHE_TTL);
}

export async function getById(id: string) {
  return getOrSet(authorCacheKey(id), () => findByIdOrThrow(Author, id, "Author not found"), AUTHOR_CACHE_TTL);
}

export async function getBooks(id: string) {
  await findByIdOrThrow(Author, id, "Author not found");
  return Book.find({ author: id }).sort({ title: 1 });
}

export async function create(input: CreateAuthorInput) {
  const author = await Author.create(input);
  await invalidateCache(AUTHOR_CACHE_NS);
  return author;
}

export async function update(id: string, input: UpdateAuthorInput) {
  const author = await Author.findByIdAndUpdate(id, input, { new: true });
  if (!author) throw new NotFoundError("Author not found");
  await invalidateCache(AUTHOR_CACHE_NS);
  return author;
}

export async function remove(id: string) {
  const bookCount = await Book.countDocuments({ author: id });
  if (bookCount > 0) {
    throw new AppError(`Cannot delete author: ${bookCount} book(s) still reference this author`, 400);
  }
  const author = await Author.findByIdAndDelete(id);
  if (!author) throw new NotFoundError("Author not found");
  await invalidateCache(AUTHOR_CACHE_NS);
}
