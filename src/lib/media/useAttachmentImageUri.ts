import { useQuery } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { authClient } from "@/lib/auth/client";

/**
 * M32.3 — replaces the old `attachmentImageSource` helper, which handed
 * `expo-image` a bare `{ uri, headers: { Cookie } }` for the private,
 * session-authenticated sourcing/resolution attachment routes (unlike every
 * other image type this app renders, which uses the unauthenticated-but-
 * unguessable-key convention and a bare `{ uri }`).
 *
 * Root cause of the real-device "images render dark/blank" bug (M32.3
 * brief §10): per Expo's own `expo-image` docs, its cache key is the URI
 * alone — headers are never part of the cache key. A single failed/
 * unauthenticated load (a cold-start render race, a transient network
 * blip, a restart before the persisted session cookie is re-read) gets
 * permanently cached under that URI and is never retried, because a retry
 * reuses the same cache entry regardless of the now-valid Cookie header.
 * That exactly matches the reported symptom: attachment count/swipe UI
 * works fine (a separate JSON fetch), but the image itself renders
 * dark/blank, consistently, on the affected device.
 *
 * Fix: stop asking `expo-image` to do authenticated networking at all.
 * Fetch the bytes ourselves with a plain authenticated `fetch` — the exact
 * mechanism `src/lib/api/client.ts` already uses successfully for every
 * JSON call — write them to a per-attachment-id file in the app's cache
 * directory once, and hand `expo-image` a bare local `file://` URI. Same
 * "no custom headers" shape every other image type already uses, with real
 * retry-on-failure/loading-state semantics via `useQuery`, and zero backend
 * change: `getAttachmentForDownload`'s owner/staff/solicited-factory check
 * is untouched — only how the already-authorized bytes reach the image
 * view changes.
 *
 * Cached by attachment id only (no file extension) — both iOS and Android
 * image decoders (and expo-image itself) sniff format from content, not
 * from a file's extension, and every attachment this app uploads is
 * produced by `prepareImage`'s JPEG pipeline anyway.
 */
function cacheKeyFromUrl(url: string): string {
  const id = url.split("/").filter(Boolean).pop() ?? url;
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function fetchAndCache(url: string): Promise<string> {
  const file = new File(Paths.cache, `attachment-${cacheKeyFromUrl(url)}`);
  if (file.exists) return file.uri;

  const cookie = authClient.getCookie();
  const response = await fetch(url, { headers: cookie ? { Cookie: cookie } : undefined });
  if (!response.ok) {
    throw new Error(`Could not load attachment (${response.status}).`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  file.write(bytes);
  return file.uri;
}

/** `url` may be null/undefined (e.g. a request with no thumbnail yet) — the query simply stays disabled. */
export function useAttachmentImageUri(url: string | null | undefined) {
  return useQuery({
    queryKey: ["attachment-image", url],
    queryFn: () => fetchAndCache(url as string),
    enabled: Boolean(url),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });
}
