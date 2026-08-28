import { useMutation, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ExplorePostDTO, ExplorePostFeedDTO } from "@/types/api";

type FeedData = InfiniteData<ExplorePostFeedDTO>;

/**
 * Optimistically flips one post's engagement across every cached Explore
 * query (the main feed under any category filter, plus the Saved list) —
 * a post can be visible in more than one cached page at once, so every
 * query starting with "explore-feed"/"explore-saved" is walked, not just
 * the one the tapped card happens to be rendered from. Returns the previous
 * snapshot for rollback on error (§30/§32: optimistic updates only where
 * rollback is safe and simple).
 */
function setEngagementInCaches(
  queryClient: QueryClient,
  postId: string,
  updater: (engagement: ExplorePostDTO["engagement"]) => ExplorePostDTO["engagement"],
) {
  const snapshots: { queryKey: readonly unknown[]; data: FeedData | undefined }[] = [];

  for (const prefix of ["explore-feed", "explore-saved"]) {
    const queries = queryClient.getQueriesData<FeedData>({ queryKey: [prefix] });
    for (const [queryKey, data] of queries) {
      snapshots.push({ queryKey, data });
      if (!data) continue;
      queryClient.setQueryData<FeedData>(queryKey, {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          rows: page.rows.map((row) => (row.id === postId ? { ...row, engagement: updater(row.engagement) } : row)),
        })),
      });
    }
  }

  return snapshots;
}

function rollback(queryClient: QueryClient, snapshots: { queryKey: readonly unknown[]; data: FeedData | undefined }[]) {
  for (const { queryKey, data } of snapshots) {
    queryClient.setQueryData(queryKey, data);
  }
}

/** Like/unlike — idempotent both ways server-side (see app/api/v1/explore-posts/[id]/like/route.ts). */
export function useToggleExploreLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked
        ? apiClient.delete<{ liked: boolean }>(`/api/v1/explore-posts/${postId}/like`)
        : apiClient.post<{ liked: boolean }>(`/api/v1/explore-posts/${postId}/like`),
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ["explore-feed"] });
      await queryClient.cancelQueries({ queryKey: ["explore-saved"] });
      const snapshots = setEngagementInCaches(queryClient, postId, (engagement) => ({
        ...engagement,
        likedByMe: !liked,
        likeCount: Math.max(0, engagement.likeCount + (liked ? -1 : 1)),
      }));
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (context) rollback(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["explore-feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore-saved"] });
    },
  });
}

/** Save/unsave — idempotent both ways server-side (see app/api/v1/explore-posts/[id]/save/route.ts). */
export function useToggleExploreSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, saved }: { postId: string; saved: boolean }) =>
      saved
        ? apiClient.delete<{ saved: boolean }>(`/api/v1/explore-posts/${postId}/save`)
        : apiClient.post<{ saved: boolean }>(`/api/v1/explore-posts/${postId}/save`),
    onMutate: async ({ postId, saved }) => {
      await queryClient.cancelQueries({ queryKey: ["explore-feed"] });
      await queryClient.cancelQueries({ queryKey: ["explore-saved"] });
      const snapshots = setEngagementInCaches(queryClient, postId, (engagement) => ({ ...engagement, savedByMe: !saved }));
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (context) rollback(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["explore-feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore-saved"] });
    },
  });
}
