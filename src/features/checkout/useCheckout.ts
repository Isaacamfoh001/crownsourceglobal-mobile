import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { CART_QUERY_KEY } from "@/features/cart/useCart";
import type { DeliveryInfoInput } from "@/types/api";

/**
 * Cart → PENDING_PAYMENT Order (M25) — `POST /api/v1/checkout`. Reuses the
 * exact same ordersService.createOrderFromCart the web checkout page and
 * M24's quote-acceptance path call; the server independently revalidates
 * listing status/MOQ/availability/price and creates the real
 * InventoryReservation — this only sends delivery details, never a total.
 */
export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeliveryInfoInput) => apiClient.post<{ orderId: string }>("/api/v1/checkout", { body: input }),
    onSuccess: () => {
      // The Cart this Order came from is now CONVERTED — the cached "active
      // cart" view is stale regardless of whether the customer completes
      // payment; refetch rather than guess its post-checkout shape.
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}
