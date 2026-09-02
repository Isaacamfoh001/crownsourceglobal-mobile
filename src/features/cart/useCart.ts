import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { CartViewDTO } from "@/types/api";

export const CART_QUERY_KEY = ["cart"] as const;

/**
 * The signed-in customer's active cart (M25) — `GET /api/v1/cart`. Cart is
 * CustomerProfile-owned with no anonymous/guest cart in the approved model
 * (see prisma/schema.prisma's Cart doc comment on the backend), so this is
 * only ever called for a signed-in customer — see `enabled`.
 */
export function useCart(enabled: boolean) {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => apiClient.get<CartViewDTO>("/api/v1/cart"),
    enabled,
  });
}
