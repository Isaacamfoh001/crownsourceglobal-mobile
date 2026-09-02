import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { VendorDashboardDTO } from "@/types/api";

/** GET /api/v1/vendor/dashboard (M27) — the Vendor Mode home screen. */
export function useVendorDashboard(enabled: boolean) {
  return useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: () => apiClient.get<VendorDashboardDTO>("/api/v1/vendor/dashboard"),
    enabled,
  });
}
