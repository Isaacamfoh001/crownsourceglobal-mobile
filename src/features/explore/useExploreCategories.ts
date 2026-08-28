import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ExploreCategoryDTO } from "@/types/api";

/** The fixed Explore category allowlist (M21) — `GET /api/v1/explore-posts/categories`. Backs the create-post category picker. */
export function useExploreCategories(enabled = true) {
  return useQuery({
    queryKey: ["explore-categories"],
    queryFn: () => apiClient.get<{ categories: ExploreCategoryDTO[] }>("/api/v1/explore-posts/categories"),
    staleTime: 10 * 60_000, // reference data — rarely changes within a session
    enabled,
  });
}
