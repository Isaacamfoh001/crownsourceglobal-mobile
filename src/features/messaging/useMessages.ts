import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ConversationDetailDTO, ConversationSummaryDTO, Page } from "@/types/api";

export const CONVERSATIONS_QUERY_KEY = ["messages"] as const;

/** The customer-side contextual conversation kinds `POST /api/v1/messages` accepts — never GENERAL (only a vendor can start a contextless conversation). */
export type CustomerContextType = "LISTING" | "VENDOR" | "ORDER" | "SOURCING_REQUEST" | "RESOLUTION_CASE";

/** GET /api/v1/messages (M30) — the signed-in customer's own conversations with CrownSourceGlobal, newest-first, paginated. */
export function useConversations(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => apiClient.get<Page<ConversationSummaryDTO>>("/api/v1/messages", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

/** GET /api/v1/messages/:id (M30) — full conversation thread for the owning customer. */
export function useConversationDetail(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["message", conversationId],
    queryFn: () => apiClient.get<ConversationDetailDTO>(`/api/v1/messages/${conversationId}`),
    enabled: Boolean(conversationId),
  });
}

/** POST /api/v1/messages/:id/reply (M30) — reply into an existing conversation. */
export function useReplyToConversation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiClient.post(`/api/v1/messages/${conversationId}/reply`, { body: { body } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message", conversationId] });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

/**
 * POST /api/v1/messages (M30) — "Ask about this item/vendor/order/sourcing
 * request/case", mirroring the web `AskAboutButton`. Returns the (new or
 * reused) conversation id so the caller can navigate straight to the
 * thread.
 */
export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { contextType: CustomerContextType; contextRefId: string; body: string }) =>
      apiClient.post<{ conversationId: string }>("/api/v1/messages", { body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}
