import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ListingSummaryDTO, Page } from "@/types/api";

export type ListingsFilter = {
  search?: string;
  category?: string;
};

/**
 * Infinite query over the same paginated `/api/v1/listings` the web /shop
 * page uses — one flat list with `page`/`pageSize`/`total`, not a new
 * cursor-based contract invented for mobile (MOBILE_V1_PLAN.md §11).
 */
export function useListings(filter: ListingsFilter) {
  return useInfiniteQuery({
    queryKey: ["listings", filter],
    queryFn: ({ pageParam }) =>
      apiClient.get<Page<ListingSummaryDTO>>("/api/v1/listings", {
        query: { q: filter.search, category: filter.category, page: pageParam },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });
}
