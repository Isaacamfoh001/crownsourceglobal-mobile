import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ResolutionCaseDetailDTO } from "@/types/api";

/** GET /api/v1/resolutions/:id (M26) — read-only case detail for the owning customer. */
export function useResolutionCaseDetail(caseId: string | undefined) {
  return useQuery({
    queryKey: ["resolution-case", caseId],
    queryFn: () => apiClient.get<ResolutionCaseDetailDTO>(`/api/v1/resolutions/${caseId}`),
    enabled: Boolean(caseId),
  });
}
