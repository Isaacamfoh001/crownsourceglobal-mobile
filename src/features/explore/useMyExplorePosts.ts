import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { MyExplorePostDTO, Page } from "@/types/api";

/** The signed-in eligible vendor's own posts at every moderation status (M21) — `GET /api/v1/explore-posts/mine`. */
export function useMyExplorePosts(enabled: boolean) {
  return useQuery({
    queryKey: ["explore-mine"],
    queryFn: () => apiClient.get<Page<MyExplorePostDTO>>("/api/v1/explore-posts/mine"),
    enabled,
  });
}
