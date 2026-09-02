import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { OrderDetailDTO, OrderListItemDTO, Page } from "@/types/api";

/** GET /api/v1/orders (M26) — this customer's own orders, newest-first, paginated. */
export function useOrders(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["orders"],
    queryFn: ({ pageParam }) => apiClient.get<Page<OrderListItemDTO>>("/api/v1/orders", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

/** GET /api/v1/orders/:id (M26) — full detail: vendor/fulfilment breakdown, tracking timeline, payment, resolution cases. */
export function useOrderDetail(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => apiClient.get<OrderDetailDTO>(`/api/v1/orders/${orderId}`),
    enabled: Boolean(orderId),
  });
}
