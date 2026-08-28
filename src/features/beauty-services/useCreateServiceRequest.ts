import { useMutation, useQueryClient } from "@tanstack/react-query";
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
        // React Native's FormData accepts { uri, name, type } for a file part, not a real Blob/File.
        form.append("referenceImage", { uri: input.referenceImage.uri, name: input.referenceImage.fileName, type: input.referenceImage.mimeType } as unknown as Blob);
      }
      return apiClient.post<{ id: string }>("/api/v1/service-requests", { form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}
