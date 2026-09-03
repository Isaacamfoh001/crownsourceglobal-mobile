import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ConversationDetailDTO, ConversationSummaryDTO, Page } from "@/types/api";

export const VENDOR_CONVERSATIONS_QUERY_KEY = ["vendor-messages"] as const;

/** GET /api/v1/vendor/messages (M30) — this vendor's own conversations with CrownSourceGlobal, newest-first, paginated. */
export function useVendorConversations(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: VENDOR_CONVERSATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => apiClient.get<Page<ConversationSummaryDTO>>("/api/v1/vendor/messages", { query: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled,
  });
}

/** GET /api/v1/vendor/messages/:id (M30) — full conversation thread for the owning vendor. */
export function useVendorConversationDetail(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-message", conversationId],
    queryFn: () => apiClient.get<ConversationDetailDTO>(`/api/v1/vendor/messages/${conversationId}`),
    enabled: Boolean(conversationId),
  });
}

/** POST /api/v1/vendor/messages/:id/reply (M30) — reply into an existing conversation. */
export function useVendorReplyToConversation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiClient.post(`/api/v1/vendor/messages/${conversationId}/reply`, { body: { body } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-message", conversationId] });
      queryClient.invalidateQueries({ queryKey: VENDOR_CONVERSATIONS_QUERY_KEY });
    },
  });
}

/**
 * POST /api/v1/vendor/messages (M30) — start a new conversation with
 * CrownSourceGlobal. Omit `contextResolutionCaseId` for a general "Contact
 * CrownSourceGlobal" message (mirrors the web `StartVendorConversationForm`);
 * include it to message about a specific resolution case (mirrors
 * `startVendorResolutionConversationAction`).
 */
export function useStartVendorConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; contextResolutionCaseId?: string }) =>
      apiClient.post<{ conversationId: string }>("/api/v1/vendor/messages", { body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_CONVERSATIONS_QUERY_KEY });
    },
  });
}
