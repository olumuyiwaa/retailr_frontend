import { useState } from "react";

/**
 * Page state for a filtered list. Pass a key that changes whenever the filters do (category, search, sort...)
 * and the list goes back to page 1 by itself.
 */
export function usePagination<T>(items: T[], resetKey: string, size: number) {
  const [page, setPage] = useState(1);
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, totalPages);
  return { current, totalPages, setPage, visible: items.slice((current - 1) * size, current * size) };
}
