import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { VendorApplicationDTO } from "@/types/api";

export const VENDOR_APPLICATION_QUERY_KEY = ["vendor-application"];

/** GET /api/v1/vendor-application (M27) — get-or-create; only fetched once the user has opted into onboarding (see account.tsx's "Start selling"). */
export function useVendorApplication(enabled: boolean) {
  return useQuery({
    queryKey: VENDOR_APPLICATION_QUERY_KEY,
    queryFn: () => apiClient.get<VendorApplicationDTO>("/api/v1/vendor-application"),
    enabled,
  });
}

function useStepMutation<T>(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: T) => apiClient.patch<null>(path, { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VENDOR_APPLICATION_QUERY_KEY }),
  });
}

export function useSaveSellerType() {
  return useStepMutation<{ sellerType: string }>("/api/v1/vendor-application/seller-type");
}

export function useSaveContact() {
  return useStepMutation<{ contactName: string; contactEmail: string; contactPhone: string }>("/api/v1/vendor-application/contact");
}

export function useSaveBusiness() {
  return useStepMutation<{
    displayName: string;
    legalName?: string;
    storeDescription: string;
    registrationNumber?: string;
    taxIdentifier?: string;
    yearEstablished?: number;
    websiteUrl?: string;
    country: string;
    region: string;
    city: string;
    addressLine1: string;
  }>("/api/v1/vendor-application/business");
}

export function useSaveOperations() {
  return useStepMutation<{
    categorySlugs: string[];
    sellingMode: "retail" | "wholesale" | "both";
    bulkCapable: boolean;
    leadTimeDaysDefault?: number;
    serviceAreas?: string;
  }>("/api/v1/vendor-application/operations");
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<null>("/api/v1/vendor-application/submit"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_APPLICATION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
