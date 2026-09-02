import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { AddressDTO } from "@/types/api";

/** The signed-in customer's saved delivery addresses (M24) — `GET /api/v1/me/addresses`, used to prefill the quote-acceptance delivery step. */
export function useAddresses(enabled: boolean) {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiClient.get<AddressDTO[]>("/api/v1/me/addresses"),
    enabled,
  });
}
