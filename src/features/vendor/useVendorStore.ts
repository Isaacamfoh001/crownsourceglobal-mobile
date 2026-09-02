import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { VendorStoreProfileDTO } from "@/types/api";

export function useVendorStoreProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["vendor-store"],
    queryFn: () => apiClient.get<VendorStoreProfileDTO>("/api/v1/vendor/store"),
    enabled,
  });
}

export type VendorStoreProfileInput = {
  companyName: string;
  description?: string;
  logoUrl?: string;
  country?: string;
  region?: string;
  city?: string;
  categorySlugs: string[];
  contactEmail?: string;
  contactPhone?: string;
  leadTimeDaysDefault?: number;
  pickupAddressLine1?: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  pickupHours?: string;
  pickupNotes?: string;
};

export function useUpdateVendorStoreProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorStoreProfileInput) => apiClient.patch<null>("/api/v1/vendor/store", { body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-store"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
