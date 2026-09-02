import { useMutation, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import { apiClient } from "@/lib/api/client";

export type ExplorePostImageInput = { uri: string; mimeType: string; fileName: string };

type CreateExplorePostInput = {
  caption: string;
  categoryId: string;
  images: ExplorePostImageInput[];
};

/**
 * Mobile's one-shot create-and-submit flow (M21 §17) — `POST
 * /api/v1/explore-posts`, `multipart/form-data`. Images are appended as
 * `expo-file-system` `File` instances (M24.1) — NOT the legacy RN
 * `{ uri, name, type }` object: this app's global `fetch` is Expo's
 * spec-compliant Winter fetch, whose FormData-to-multipart conversion only
 * accepts a string, a real Blob, or an object with a working `.bytes()`
 * method — the bare `{ uri, name, type }` shape throws "Unsupported
 * FormDataPart implementation" on a physical device (see
 * useSubmitTalentApplication.ts's doc comment for the full story).
 */
export function useCreateExplorePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caption, categoryId, images }: CreateExplorePostInput) => {
      const form = new FormData();
      form.append("caption", caption);
      form.append("categoryId", categoryId);
      for (const image of images) {
        form.append("images", new File(image.uri));
      }
      return apiClient.post<{ id: string }>("/api/v1/explore-posts", { form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["explore-mine"] });
    },
  });
}
