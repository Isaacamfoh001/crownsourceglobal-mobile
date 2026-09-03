import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Page, VendorResolutionCaseDetailDTO, VendorResolutionCaseSummaryDTO } from "@/types/api";

/** GET /api/v1/vendor/resolutions (M29.1) — this vendor's own resolution cases, newest-first, paginated. */
export function useVendorResolutions(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["vendor-resolutions"],
    queryFn: ({ pageParam }) =>
      apiClient.get<Page<VendorResolutionCaseSummaryDTO>>("/api/v1/vendor/resolutions", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useVendorResolutionDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor-resolution", id],
    queryFn: () => apiClient.get<VendorResolutionCaseDetailDTO>(`/api/v1/vendor/resolutions/${id}`),
    enabled: Boolean(id),
  });
}
