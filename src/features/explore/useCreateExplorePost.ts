import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export type ExplorePostImageInput = { uri: string; mimeType: string; fileName: string };

type CreateExplorePostInput = {
  caption: string;
  categoryId: string;
  images: ExplorePostImageInput[];
};

/**
 * Mobile's one-shot create-and-submit flow (M21 §17) — `POST
 * /api/v1/explore-posts`, `multipart/form-data`. React Native's `fetch`
 * accepts a `{ uri, name, type }` object per file part directly (no manual
 * blob conversion needed) — see apiClient.post's `form` option.
 */
export function useCreateExplorePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caption, categoryId, images }: CreateExplorePostInput) => {
      const form = new FormData();
      form.append("caption", caption);
      form.append("categoryId", categoryId);
      for (const image of images) {
        // React Native's FormData accepts { uri, name, type } for a file part, not a real Blob/File.
        form.append("images", { uri: image.uri, name: image.fileName, type: image.mimeType } as unknown as Blob);
      }
      return apiClient.post<{ id: string }>("/api/v1/explore-posts", { form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["explore-mine"] });
    },
  });
}
