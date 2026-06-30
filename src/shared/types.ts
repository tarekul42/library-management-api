export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  status?: string;
}

export interface IPaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
