import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { OrderSummaryDTO } from "@/types/api";

/** Minimal order read (M24) — only for the post-quote-acceptance confirmation screen. See types/api.ts's OrderSummaryDTO doc comment. */
export function useOrderSummary(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-summary", orderId],
    queryFn: () => apiClient.get<OrderSummaryDTO>(`/api/v1/orders/${orderId}`),
    enabled: Boolean(orderId),
  });
}
