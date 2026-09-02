import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { CART_QUERY_KEY } from "./useCart";
import type { CartViewDTO } from "@/types/api";

/**
 * Cart mutations (M25) — each of add/update/remove has its route return the
 * refreshed CartView directly (see the backend's app/api/v1/cart/**
 * routes), so every mutation here writes that response straight into the
 * `cart` query cache instead of triggering a second round-trip refetch.
 */

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { listingId: string; quantity: number }) =>
      apiClient.post<CartViewDTO>("/api/v1/cart/items", { body: input }),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { cartItemId: string; quantity: number }) =>
      apiClient.patch<CartViewDTO>(`/api/v1/cart/items/${input.cartItemId}`, { body: { quantity: input.quantity } }),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => apiClient.delete<CartViewDTO>(`/api/v1/cart/items/${cartItemId}`),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}
