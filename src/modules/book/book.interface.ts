type Genre =
  | "FICTION"
  | "NON_FICTION"
  | "SCIENCE"
  | "HISTORY"
  | "BIOGRAPHY"
  | "FANTASY";

export interface IBook {
  title: string;
  author: string;
  genre: Genre;
  isbn: string;
  description?: string;
  copies: number;
  available: boolean;
}

export interface GetBookQuery {
  filter?: string;
  sortBy?: string;
  sort?: "asc" | "desc";
  limit?: string;
}

export interface IAvailability {
  copies: number;
  available: boolean;
  updateAvailability: () => Promise<IAvailability>;
}
