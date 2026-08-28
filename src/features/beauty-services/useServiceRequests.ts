import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Page, ServiceRequestDTO } from "@/types/api";

/** The signed-in customer's own submitted service requests (M22 §17) — `GET /api/v1/service-requests`, page-paginated. */
export function useServiceRequests(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["service-requests"],
    queryFn: ({ pageParam }) => apiClient.get<Page<ServiceRequestDTO>>("/api/v1/service-requests", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useServiceRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["service-request", id],
    queryFn: () => apiClient.get<ServiceRequestDTO>(`/api/v1/service-requests/${id}`),
    enabled: Boolean(id),
  });
}
