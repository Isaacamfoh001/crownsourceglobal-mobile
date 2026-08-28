import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { BeautyProfessionalFeedDTO } from "@/types/api";

/**
 * Public Beauty Services discovery feed (M22) — `GET
 * /api/v1/beauty-professionals`, cursor-paginated, same convention as
 * useExploreFeed. Works signed-out — browsing professionals is public
 * (M22 §13); only "Request Service" requires sign-in.
 */
export function useBeautyProfessionals(categorySlug?: string, search?: string) {
  return useInfiniteQuery({
    queryKey: ["beauty-professionals", categorySlug ?? null, search ?? null],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiClient.get<BeautyProfessionalFeedDTO>("/api/v1/beauty-professionals", { query: { category: categorySlug, q: search, cursor: pageParam } }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
