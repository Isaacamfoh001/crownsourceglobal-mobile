import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import { apiClient } from "@/lib/api/client";
import type { OrderResolutionContextDTO } from "@/types/api";

/** GET /api/v1/orders/:id/resolution-context (M29.1) — backs the "Report a problem" entry point. */
export function useOrderResolutionContext(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-resolution-context", orderId],
    queryFn: () => apiClient.get<OrderResolutionContextDTO>(`/api/v1/orders/${orderId}/resolution-context`),
    enabled: Boolean(orderId),
  });
}

export type SubmitResolutionCaseInput = {
  orderId: string;
  issueType: string;
  requestedResolution?: string;
  description: string;
  fulfilmentId?: string;
  items: { orderItemId: string; quantity: number }[];
  photos: { uri: string; mimeType: string; fileName: string }[];
};

/**
 * POST /api/v1/resolutions (M29.1) — case CREATION from mobile. Same
 * File+FormData upload pattern as every other mobile mutation (Source,
 * Explore, Careers, Beauty Services) — never base64, never a manually-set
 * Content-Type.
 */
export function useSubmitResolutionCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitResolutionCaseInput) => {
      const form = new FormData();
      form.append("orderId", input.orderId);
      form.append("issueType", input.issueType);
      if (input.requestedResolution) form.append("requestedResolution", input.requestedResolution);
      form.append("description", input.description);
      if (input.fulfilmentId) form.append("fulfilmentId", input.fulfilmentId);
      for (const item of input.items) {
        form.append("orderItemId", item.orderItemId);
        form.append("quantity", String(item.quantity));
      }
      for (const photo of input.photos) form.append("evidence", new File(photo.uri));
      return apiClient.post<{ caseId: string; caseNumber: string }>("/api/v1/resolutions", { form });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
