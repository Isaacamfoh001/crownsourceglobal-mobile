import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Page, VendorSolicitationDetailDTO, VendorSolicitationSummaryDTO } from "@/types/api";

/** GET /api/v1/vendor/sourcing-requests (M25.2 API, M29.1 mobile UI) — this factory's own solicitation queue, newest-first, paginated. */
export function useVendorSourcingSolicitations(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["vendor-sourcing-solicitations"],
    queryFn: ({ pageParam }) =>
      apiClient.get<Page<VendorSolicitationSummaryDTO>>("/api/v1/vendor/sourcing-requests", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useVendorSolicitationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor-sourcing-solicitation", id],
    queryFn: () => apiClient.get<VendorSolicitationDetailDTO>(`/api/v1/vendor/sourcing-requests/${id}`),
    enabled: Boolean(id),
  });
}

export type RespondToSolicitationInput =
  | { id: string; canFulfil: false }
  | { id: string; canFulfil: true; proposedQuantity: number; unitPrice: number; leadTimeDays?: number; notes?: string };

/** POST /api/v1/vendor/sourcing-requests/:id/respond — the factory's Can fulfil / Cannot fulfil response. */
export function useRespondToSolicitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: RespondToSolicitationInput) =>
      apiClient.post<null>(`/api/v1/vendor/sourcing-requests/${id}/respond`, { body }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-sourcing-solicitation", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-sourcing-solicitations"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });
}
