import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { DeliveryInfoInput } from "@/types/api";

/**
 * Quote acceptance (M24) — `POST /api/v1/quotations/:id/accept`, JSON body.
 * Reuses the exact same ordersService.createOrderFromQuotation the web
 * checkout/quote flow calls; this only creates a PENDING_PAYMENT Order.
 * Native payment is M25's scope — the accept screen shows that honestly
 * rather than pretending the order is paid.
 */
export function useAcceptQuotation(quotationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeliveryInfoInput) => apiClient.post<{ orderId: string }>(`/api/v1/quotations/${quotationId}/accept`, { body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}
