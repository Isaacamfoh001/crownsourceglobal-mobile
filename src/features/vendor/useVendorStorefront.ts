import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { VendorStorefrontResponseDTO } from "@/types/api";

/**
 * Infinite query over the same `vendorsService.getStorefront(slug, page,
 * pageSize)` call the web storefront page makes — each page re-returns the
 * (unchanging) vendor object alongside one page of listings, so paging
 * only ever appends more `listings.rows`.
 */
export function useVendorStorefront(slug: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["vendor", slug],
    queryFn: ({ pageParam }) =>
      apiClient.get<VendorStorefrontResponseDTO>(`/api/v1/vendors/${slug}`, { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.listings.page < lastPage.listings.totalPages ? lastPage.listings.page + 1 : undefined,
    enabled: Boolean(slug),
  });
}
