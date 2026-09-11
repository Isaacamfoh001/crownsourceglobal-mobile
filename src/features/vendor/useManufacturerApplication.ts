import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ManufacturerApplicationDTO } from "@/types/api";

export const MANUFACTURER_APPLICATION_QUERY_KEY = ["manufacturer-application"];

/** GET /api/v1/vendor/manufacturer-application (M32.8) — null when this Vendor hasn't applied for Manufacturer capability yet. */
export function useManufacturerApplication(enabled: boolean) {
  return useQuery({
    queryKey: MANUFACTURER_APPLICATION_QUERY_KEY,
    queryFn: () => apiClient.get<ManufacturerApplicationDTO | null>("/api/v1/vendor/manufacturer-application"),
    enabled,
  });
}

/**
 * PATCH /api/v1/vendor/manufacturer-application (M32.8) — submit (first
 * time) or edit-and-resubmit (after CHANGES_REQUESTED/REJECTED). A single
 * short step, not a wizard — the response is just `{ status }`, so the
 * mutation invalidates the query above (and `me`, since Factory eligibility
 * and `manufacturer.application` both live there) to pick up the full
 * refreshed record.
 */
export function useSubmitManufacturerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { categorySlugs: string[]; categoryOther?: string }) =>
      apiClient.patch<{ status: string }>("/api/v1/vendor/manufacturer-application", { body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANUFACTURER_APPLICATION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
