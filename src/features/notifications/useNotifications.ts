import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { NotificationDTO, Page, UnreadCountDTO } from "@/types/api";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const UNREAD_COUNT_QUERY_KEY = ["notifications-unread-count"] as const;

type NotificationsFeed = InfiniteData<Page<NotificationDTO>>;

/** GET /api/v1/notifications (M28) — the signed-in user's own inbox, newest-first, paginated. */
export function useNotifications(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => apiClient.get<Page<NotificationDTO>>("/api/v1/notifications", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

/**
 * GET /api/v1/notifications/unread-count (M28) — powers the Home bell
 * badge. No interval polling (CLAUDE.md-adjacent M28 guidance: never
 * aggressively poll) — it refreshes via the default staleTime/refetch-on-
 * mount behavior every other query in this app already uses, plus the
 * explicit cache invalidation the mutations below perform, which updates
 * this query immediately (even while Home stays mounted in the background
 * tab) the moment a notification is read.
 */
export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: () => apiClient.get<UnreadCountDTO>("/api/v1/notifications/unread-count"),
    enabled,
  });
}

function decrementUnreadCache(queryClient: ReturnType<typeof useQueryClient>, by: number) {
  queryClient.setQueryData<UnreadCountDTO>(UNREAD_COUNT_QUERY_KEY, (current) =>
    current ? { unreadCount: Math.max(0, current.unreadCount - by) } : current,
  );
}

function markRowReadInCache(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  let wasUnread = false;
  queryClient.setQueriesData<NotificationsFeed>({ queryKey: NOTIFICATIONS_QUERY_KEY }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        rows: page.rows.map((row) => {
          if (row.id !== id || row.readAt) return row;
          wasUnread = true;
          return { ...row, readAt: new Date().toISOString() };
        }),
      })),
    };
  });
  return wasUnread;
}

/**
 * POST /api/v1/notifications/:id/read (M28) — optimistic: flips the row in
 * the cached inbox and decrements the unread badge immediately (both safe,
 * reversible UI-only changes), then reconciles with the server response.
 * Never blocks navigation on the network round-trip — the caller
 * navigates regardless of whether this mutation has settled yet (§9).
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<{ read: boolean }>(`/api/v1/notifications/${id}/read`),
    onMutate: (id: string) => {
      const wasUnread = markRowReadInCache(queryClient, id);
      if (wasUnread) decrementUnreadCache(queryClient, 1);
      return { wasUnread };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}

/** POST /api/v1/notifications/mark-all-read (M28) — optimistic locally, then reconciled with server truth. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ read: boolean }>("/api/v1/notifications/mark-all-read"),
    onMutate: () => {
      const now = new Date().toISOString();
      queryClient.setQueriesData<NotificationsFeed>({ queryKey: NOTIFICATIONS_QUERY_KEY }, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({ ...page, rows: page.rows.map((row) => (row.readAt ? row : { ...row, readAt: now })) })),
        };
      });
      queryClient.setQueryData<UnreadCountDTO>(UNREAD_COUNT_QUERY_KEY, { unreadCount: 0 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
