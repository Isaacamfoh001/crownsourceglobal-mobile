import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ExploreResponseDTO } from "@/types/api";

export function useExplore() {
  return useQuery({
    queryKey: ["explore"],
    queryFn: () => apiClient.get<ExploreResponseDTO>("/api/v1/explore"),
  });
}
