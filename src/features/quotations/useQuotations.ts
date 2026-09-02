import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Page, QuotationDetailDTO, QuotationSummaryDTO } from "@/types/api";

/** The signed-in customer's own quotations (M24) — `GET /api/v1/quotations`, page-paginated. */
export function useQuotations(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["quotations"],
    queryFn: ({ pageParam }) => apiClient.get<Page<QuotationSummaryDTO>>("/api/v1/quotations", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useQuotationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["quotation", id],
    queryFn: () => apiClient.get<QuotationDetailDTO>(`/api/v1/quotations/${id}`),
    enabled: Boolean(id),
  });
}
