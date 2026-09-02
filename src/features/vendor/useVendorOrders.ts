import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Page, VendorFulfilmentDetailDTO, VendorFulfilmentSummaryDTO } from "@/types/api";

/** GET /api/v1/vendor/orders (M27) — newest-first, paginated, optional status filter. */
export function useVendorOrders(status: string | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["vendor-orders", status ?? "ALL"],
    queryFn: ({ pageParam }) =>
      apiClient.get<Page<VendorFulfilmentSummaryDTO>>("/api/v1/vendor/orders", { query: { status, page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useVendorOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor-order", id],
    queryFn: () => apiClient.get<VendorFulfilmentDetailDTO>(`/api/v1/vendor/orders/${id}`),
    enabled: Boolean(id),
  });
}

function useOrderActionMutation(action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => apiClient.post<null>(`/api/v1/vendor/orders/${orderId}/${action}`),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });
}

/** PENDING -> PREPARING — the only valid next action from PENDING (M27 §14). */
export function useStartPreparingOrder() {
  return useOrderActionMutation("start-preparing");
}

/** PREPARING -> READY. */
export function useMarkOrderReady() {
  return useOrderActionMutation("mark-ready");
}

export function useShipVendorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { orderId: string; carrier: string; trackingReference: string; shippedAt: string; expectedArrivalAt?: string }) =>
      apiClient.post<null>(`/api/v1/vendor/orders/${input.orderId}/ship`, {
        body: {
          carrier: input.carrier,
          trackingReference: input.trackingReference,
          shippedAt: input.shippedAt,
          expectedArrivalAt: input.expectedArrivalAt,
        },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    },
  });
}

export function useReportOrderIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { orderId: string; category: string; description: string }) =>
      apiClient.post<null>(`/api/v1/vendor/orders/${input.orderId}/report-issue`, {
        body: { category: input.category, description: input.description },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });
}
