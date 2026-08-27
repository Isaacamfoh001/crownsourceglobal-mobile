import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { CategoriesResponseDTO } from "@/types/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<CategoriesResponseDTO>("/api/v1/categories"),
    staleTime: 5 * 60_000,
  });
}
