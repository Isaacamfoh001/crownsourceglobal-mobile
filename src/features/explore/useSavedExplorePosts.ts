import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ExplorePostFeedDTO } from "@/types/api";

/** The signed-in caller's own saved posts (M21 §10) — `GET /api/v1/explore-posts/saved`, same cursor shape as the main feed. */
export function useSavedExplorePosts(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["explore-saved"],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiClient.get<ExplorePostFeedDTO>("/api/v1/explore-posts/saved", { query: { cursor: pageParam } }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
