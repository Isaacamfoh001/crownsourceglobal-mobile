import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { MeResponseDTO } from "@/types/api";

/** GET /api/v1/me — the real signed-in profile (M20.2 §16). Only meaningful once a session exists; callers gate `enabled` on that via useAuth(). */
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<MeResponseDTO>("/api/v1/me"),
    enabled,
  });
}
