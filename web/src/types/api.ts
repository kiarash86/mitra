export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}
