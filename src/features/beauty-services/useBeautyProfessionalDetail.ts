import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { BeautyProfessionalDetailDTO } from "@/types/api";

/** Public professional detail (M22) — `GET /api/v1/beauty-professionals/[id]`. Public, no auth required. */
export function useBeautyProfessionalDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["beauty-professional", id],
    queryFn: () => apiClient.get<BeautyProfessionalDetailDTO>(`/api/v1/beauty-professionals/${id}`),
    enabled: Boolean(id),
  });
}
