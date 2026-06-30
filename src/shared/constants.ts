export const GENRES = [
  "FICTION",
  "NON_FICTION",
  "SCIENCE",
  "HISTORY",
  "BIOGRAPHY",
  "FANTASY",
] as const;

export type Genre = typeof GENRES[number];

export function getMaxPublishedYear(): number {
  return new Date().getFullYear() + 5;
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const FINE_RATE_PER_DAY = 5;
export const MAX_BORROW_DAYS = 14;
export const MAX_BORROW_BOOKS = 5;
