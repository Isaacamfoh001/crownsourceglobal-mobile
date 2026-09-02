import { useMutation, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import { apiClient } from "@/lib/api/client";

export type CreateServiceRequestInput = {
  professionalId: string;
  serviceId: string;
  preferredDate: string;
  preferredTimeNote?: string;
  locationMode: "PROVIDER_LOCATION" | "CUSTOMER_LOCATION";
  locationDetails?: string;
  notes?: string;
  quantity?: number;
  referenceImage?: { uri: string; mimeType: string; fileName: string };
};

/** "Request Service" — `POST /api/v1/service-requests`, multipart/form-data (M22 §12). Authenticated only; the screen itself gates on sign-in before this ever runs. */
export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServiceRequestInput) => {
      const form = new FormData();
      form.append("professionalId", input.professionalId);
      form.append("serviceId", input.serviceId);
      form.append("preferredDate", input.preferredDate);
      if (input.preferredTimeNote) form.append("preferredTimeNote", input.preferredTimeNote);
      form.append("locationMode", input.locationMode);
      if (input.locationDetails) form.append("locationDetails", input.locationDetails);
      if (input.notes) form.append("notes", input.notes);
      if (input.quantity) form.append("quantity", String(input.quantity));
      if (input.referenceImage) {
        // M24.1 — `expo-file-system`'s `File`, not the legacy RN `{ uri, name,
        // type }` object: this app's global `fetch` is Expo's spec-compliant
        // Winter fetch, whose FormData-to-multipart conversion only accepts a
        // string, a real Blob, or an object with a working `.bytes()` method
        // — the bare `{ uri, name, type }` shape throws "Unsupported
        // FormDataPart implementation" on a physical device (see
        // useSubmitTalentApplication.ts's doc comment for the full story).
        form.append("referenceImage", new File(input.referenceImage.uri));
      }
      return apiClient.post<{ id: string }>("/api/v1/service-requests", { form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}
