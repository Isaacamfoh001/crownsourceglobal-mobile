import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import { apiClient } from "@/lib/api/client";
import type { Page, VendorListingDetailDTO, VendorListingSummaryDTO } from "@/types/api";

/** GET /api/v1/vendor/listings (M27) — newest-first, paginated. */
export function useVendorListings(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["vendor-listings"],
    queryFn: ({ pageParam }) => apiClient.get<Page<VendorListingSummaryDTO>>("/api/v1/vendor/listings", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

export function useVendorListingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["vendor-listing", id],
    queryFn: () => apiClient.get<VendorListingDetailDTO>(`/api/v1/vendor/listings/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateVendorListingDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => apiClient.post<{ id: string }>("/api/v1/vendor/listings", { body: { categoryId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-listings"] }),
  });
}

export type VendorListingImageInput = { uri: string; mimeType: string; fileName: string };

export type SaveListingContentInput = {
  listingId: string;
  title: string;
  description: string;
  categoryId: string;
  basePrice: number;
  moq: number;
  maxOq: number | null;
  leadTimeDays: number | null;
  specs: Record<string, string> | null;
  existingImages: string[];
  newImages: VendorListingImageInput[];
  bulkTiers: { minQuantity: number; maxQuantity: number | null; unitPrice: number }[];
};

/**
 * PATCH /api/v1/vendor/listings/:id (M27) — real photo uploads only, same
 * `expo-file-system` `File` + `FormData` pattern as useCreateExplorePost.ts
 * (never the legacy `{ uri, name, type }` shape — M27 CRITICAL IMAGE RULE).
 * Callers must run each new photo through `prepareImage` first (resize/
 * recompress) before passing it here, same as the careers/Explore flows.
 */
export function useSaveVendorListingContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveListingContentInput) => {
      const form = new FormData();
      form.append("title", input.title);
      form.append("description", input.description);
      form.append("categoryId", input.categoryId);
      form.append("basePrice", String(input.basePrice));
      form.append("moq", String(input.moq));
      if (input.maxOq !== null) form.append("maxOq", String(input.maxOq));
      if (input.leadTimeDays !== null) form.append("leadTimeDays", String(input.leadTimeDays));
      if (input.specs) form.append("specs", JSON.stringify(input.specs));
      form.append("bulkTiers", JSON.stringify(input.bulkTiers));
      for (const key of input.existingImages) form.append("existingImages", key);
      for (const image of input.newImages) form.append("images", new File(image.uri));
      return apiClient.patch<null>(`/api/v1/vendor/listings/${input.listingId}`, { form });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-listing", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-listings"] });
    },
  });
}

export function useSubmitVendorListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => apiClient.post<null>(`/api/v1/vendor/listings/${listingId}/submit`),
    onSuccess: (_data, listingId) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-listings"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });
}

export function useUpdateVendorListingInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { listingId: string; availableQuantity: number; availabilityStatus: string }) =>
      apiClient.patch<null>(`/api/v1/vendor/listings/${input.listingId}/inventory`, {
        body: { availableQuantity: input.availableQuantity, availabilityStatus: input.availabilityStatus },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-listing", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-listings"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });
}

export function useToggleVendorListingActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { listingId: string; active: boolean }) =>
      apiClient.patch<null>(`/api/v1/vendor/listings/${input.listingId}/active`, { body: { active: input.active } }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-listing", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-listings"] });
    },
  });
}
