import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type {
  Page,
  VendorEarningDetailDTO,
  VendorEarningSummaryDTO,
  VendorFinanceOverviewDTO,
  VendorPayoutDestinationDTO,
  VendorSettlementDetailDTO,
  VendorSettlementSummaryDTO,
} from "@/types/api";

export function useVendorFinanceOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["vendor-finance"],
    queryFn: () => apiClient.get<VendorFinanceOverviewDTO>("/api/v1/vendor/finance"),
    enabled,
  });
}

export function useVendorEarnings(status: string | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["vendor-earnings", status ?? "ALL"],
    queryFn: ({ pageParam }) =>
      apiClient.get<Page<VendorEarningSummaryDTO>>("/api/v1/vendor/finance/earnings", { query: { status, page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useVendorEarningDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor-earning", id],
    queryFn: () => apiClient.get<VendorEarningDetailDTO>(`/api/v1/vendor/finance/earnings/${id}`),
    enabled: Boolean(id),
  });
}

export function useVendorSettlements(status: string | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["vendor-settlements", status ?? "ALL"],
    queryFn: ({ pageParam }) =>
      apiClient.get<Page<VendorSettlementSummaryDTO>>("/api/v1/vendor/finance/settlements", { query: { status, page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useVendorSettlementDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor-settlement", id],
    queryFn: () => apiClient.get<VendorSettlementDetailDTO>(`/api/v1/vendor/finance/settlements/${id}`),
    enabled: Boolean(id),
  });
}

export function useVendorPayoutDestination(enabled: boolean) {
  return useQuery({
    queryKey: ["vendor-payout-destination"],
    queryFn: () => apiClient.get<VendorPayoutDestinationDTO>("/api/v1/vendor/finance/payout-destination"),
    enabled,
  });
}

export type PayoutDestinationInput =
  | { type: "MOBILE_MONEY"; momoAccountName: string; momoPhone: string; momoNetwork: "MTN" | "TELECEL" | "AT" }
  | { type: "BANK_TRANSFER"; bankAccountName: string; bankName: string; bankAccountNumber: string };

/** OWNER-only server-side (M27 §21) — a STAFF member submitting this gets a clear error back, never a silent no-op. */
export function useUpdatePayoutDestination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PayoutDestinationInput) => apiClient.patch<null>("/api/v1/vendor/finance/payout-destination", { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-payout-destination"] }),
  });
}
