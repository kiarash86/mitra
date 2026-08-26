import { useState, useCallback } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialPerPage?: number;
}

export function usePagination({
  initialPage = 1,
  initialPerPage = 20,
}: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [perPage] = useState(initialPerPage);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToPage = useCallback((p: number) => setPage(Math.max(1, p)), []);

  return { page, perPage, nextPage, prevPage, goToPage };
}
