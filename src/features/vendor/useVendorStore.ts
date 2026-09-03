import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
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

/**
 * POST /api/v1/vendor/store/logo (M29.1) — real photo upload only,
 * replacing the old pasted-URL field. Same File+FormData pattern as
 * useVendorBeautyProfessional.ts's heroImage upload.
 */
export function useUploadVendorLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logo: { uri: string; mimeType: string; fileName: string }) => {
      const form = new FormData();
      form.append("logo", new File(logo.uri));
      return apiClient.post<null>("/api/v1/vendor/store/logo", { form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-store"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRemoveVendorLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<null>("/api/v1/vendor/store/logo"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-store"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
