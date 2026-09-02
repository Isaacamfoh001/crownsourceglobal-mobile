import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Page, SourcingRequestDetailDTO, SourcingRequestSummaryDTO } from "@/types/api";

/** The signed-in customer's own submitted sourcing requests (M24) — `GET /api/v1/sourcing-requests`, page-paginated. */
export function useSourcingRequests(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["sourcing-requests"],
    queryFn: ({ pageParam }) => apiClient.get<Page<SourcingRequestSummaryDTO>>("/api/v1/sourcing-requests", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useSourcingRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["sourcing-request", id],
    queryFn: () => apiClient.get<SourcingRequestDetailDTO>(`/api/v1/sourcing-requests/${id}`),
    enabled: Boolean(id),
  });
}
