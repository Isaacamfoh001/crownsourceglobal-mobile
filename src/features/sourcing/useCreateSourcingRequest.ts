import { useMutation, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import { apiClient } from "@/lib/api/client";
import type { PreparedImage } from "@/lib/media/prepareImage";

export type SubmitSourcingRequestInput = {
  description: string;
  quantity: number;
  quantityUnit?: string;
  deliveryCountry: string;
  deliveryRegion?: string;
  deliveryCity?: string;
  requiredByDate?: string;
  photos: PreparedImage[];
};

/**
 * "Submit sourcing request" — `POST /api/v1/sourcing-requests`,
 * multipart/form-data (M24). Photos are appended as `expo-file-system`
 * `File` instances, the SAME proven shape useSubmitTalentApplication.ts
 * established for M23 — NOT the legacy `{ uri, name, type }` object (that
 * throws "Unsupported FormDataPart implementation" against this app's Expo
 * Winter fetch; see prepareImage.ts's doc comment for the full story).
 * Content-Type/boundary is left entirely to fetch, never set manually.
 */
export function useCreateSourcingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitSourcingRequestInput) => {
      const form = new FormData();
      form.append("description", input.description);
      form.append("quantity", String(input.quantity));
      if (input.quantityUnit) form.append("quantityUnit", input.quantityUnit);
      form.append("deliveryCountry", input.deliveryCountry);
      if (input.deliveryRegion) form.append("deliveryRegion", input.deliveryRegion);
      if (input.deliveryCity) form.append("deliveryCity", input.deliveryCity);
      if (input.requiredByDate) form.append("requiredByDate", input.requiredByDate);
      for (const photo of input.photos) {
        // `File`'s own `.name`/`.type` are derived natively from the file on
        // disk — the backend never depends on the client-claimed filename
        // for anything beyond display.
        form.append("attachments", new File(photo.uri));
      }

      if (__DEV__) {
        const parts = Array.from(form as unknown as Iterable<[string, unknown]>, ([key, value]) => ({
          field: key,
          isFile: value instanceof File,
          ctor: (value as { constructor?: { name?: string } })?.constructor?.name,
        }));
        console.log("[sourcing] request FormData parts:", parts);
      }

      return apiClient.post<{ id: string; requestNumber: string }>("/api/v1/sourcing-requests", { form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sourcing-requests"] });
    },
  });
}
