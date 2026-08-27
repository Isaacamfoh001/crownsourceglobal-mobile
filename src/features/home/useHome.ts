import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { HomeResponseDTO } from "@/types/api";

export function useHome() {
  return useQuery({
    queryKey: ["home"],
    queryFn: () => apiClient.get<HomeResponseDTO>("/api/v1/home"),
  });
}
