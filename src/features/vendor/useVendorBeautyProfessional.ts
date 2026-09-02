import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import { apiClient } from "@/lib/api/client";
import type { Page, VendorBeautyProfileDTO, VendorServiceDTO, VendorServiceRequestDTO } from "@/types/api";

export function useVendorBeautyProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["vendor-beauty-profile"],
    queryFn: () => apiClient.get<VendorBeautyProfileDTO>("/api/v1/vendor/beauty-professional"),
    enabled,
  });
}

export type SaveBeautyProfileInput = {
  displayName: string;
  bio?: string;
  specialtyCategorySlugs: string[];
  locationMode: "PROVIDER_LOCATION" | "CUSTOMER_LOCATION" | "BOTH";
  heroImage?: { uri: string; mimeType: string; fileName: string };
  removeHeroImage?: boolean;
};

/** PATCH /api/v1/vendor/beauty-professional (M27) — real photo upload only, same File+FormData pattern as listings/Explore. */
export function useSaveVendorBeautyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveBeautyProfileInput) => {
      const form = new FormData();
      form.append("displayName", input.displayName);
      if (input.bio) form.append("bio", input.bio);
      for (const slug of input.specialtyCategorySlugs) form.append("specialtyCategorySlugs", slug);
      form.append("locationMode", input.locationMode);
      if (input.heroImage) form.append("heroImage", new File(input.heroImage.uri));
      if (input.removeHeroImage) form.append("removeHeroImage", "true");
      return apiClient.patch<{ status: string }>("/api/v1/vendor/beauty-professional", { form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-beauty-profile"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });
}

export function useArchiveVendorBeautyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<null>("/api/v1/vendor/beauty-professional/archive"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-beauty-profile"] }),
  });
}

export function useVendorServices(enabled: boolean) {
  return useQuery({
    queryKey: ["vendor-services"],
    queryFn: () => apiClient.get<VendorServiceDTO[]>("/api/v1/vendor/beauty-professional/services"),
    enabled,
  });
}

export type VendorServiceInput = { name: string; description?: string; categoryId: string; startingPrice?: string; currency?: string };

export function useCreateVendorService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorServiceInput) => apiClient.post<VendorServiceDTO>("/api/v1/vendor/beauty-professional/services", { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-services"] }),
  });
}

export function useUpdateVendorService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { serviceId: string } & VendorServiceInput) =>
      apiClient.patch<null>(`/api/v1/vendor/beauty-professional/services/${input.serviceId}`, { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-services"] }),
  });
}

export function useToggleVendorServiceActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { serviceId: string; active: boolean }) =>
      apiClient.patch<null>(`/api/v1/vendor/beauty-professional/services/${input.serviceId}/active`, { body: { active: input.active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-services"] }),
  });
}

export function useVendorServiceRequests(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["vendor-service-requests"],
    queryFn: ({ pageParam }) =>
      apiClient.get<Page<VendorServiceRequestDTO>>("/api/v1/vendor/beauty-professional/requests", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useVendorServiceRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor-service-request", id],
    queryFn: () => apiClient.get<VendorServiceRequestDTO>(`/api/v1/vendor/beauty-professional/requests/${id}`),
    enabled: Boolean(id),
  });
}

export function useAcceptServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<null>(`/api/v1/vendor/beauty-professional/requests/${id}/accept`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-service-request", id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-service-requests"] });
    },
  });
}

export function useDeclineServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; reason?: string }) =>
      apiClient.post<null>(`/api/v1/vendor/beauty-professional/requests/${input.id}/decline`, { body: { reason: input.reason } }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-service-request", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-service-requests"] });
    },
  });
}
