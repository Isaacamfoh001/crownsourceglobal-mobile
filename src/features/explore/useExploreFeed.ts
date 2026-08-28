import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ExplorePostFeedDTO } from "@/types/api";

/**
 * Explore's public feed (M21) — `GET /api/v1/explore-posts`, cursor-
 * paginated (not the page-number shape useListings/useVendorStorefront use;
 * see app/api/v1/explore-posts/route.ts's doc comment on the backend for
 * why a feed uses a cursor). Works signed-out or signed-in — the backend
 * itself decides whether to include real likedByMe/savedByMe.
 */
export function useExploreFeed(categorySlug?: string) {
  return useInfiniteQuery({
    queryKey: ["explore-feed", categorySlug ?? null],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiClient.get<ExplorePostFeedDTO>("/api/v1/explore-posts", { query: { category: categorySlug, cursor: pageParam } }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
