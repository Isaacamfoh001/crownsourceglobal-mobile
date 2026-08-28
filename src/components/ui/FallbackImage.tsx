import { useState, type ReactNode } from "react";
import { Image, type ImageContentFit, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

type FallbackImageProps = {
  uri: string | null | undefined;
  style: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  transition?: number;
  /** Rendered whenever there's no URI at all, OR the image failed to load — a broken/missing image must never crash or blank out the surrounding card (M22.1 §6). */
  fallback: ReactNode;
};

/**
 * The one place an image URL from the API is rendered without a guaranteed-
 * good source — a missing hero photo, an avatar the vendor never set, a
 * portfolio image whose storage key turned out stale, or any other
 * user-managed image field. Falls back to the caller's placeholder both
 * when there's no URI to try AND when a real URI 404s/network-fails after
 * mounting (expo-image's onError) — a single broken image must never
 * prevent the surrounding card/screen from rendering (M22.1 §6).
 */
export function FallbackImage({ uri, style, contentFit = "cover", transition, fallback }: FallbackImageProps) {
  const [failed, setFailed] = useState(false);

  // Reset failure state when the URI itself changes — list rows get their
  // component instances recycled by FlatList, so a previous row's failure
  // must not leak onto a different item. Adjusted during render (not an
  // effect) per https://react.dev/learn/you-might-not-need-an-effect —
  // same pattern this codebase's shop.tsx already uses for its own
  // incoming-param sync.
  const [lastUri, setLastUri] = useState(uri);
  if (uri !== lastUri) {
    setLastUri(uri);
    setFailed(false);
  }

  if (!uri || failed) return <>{fallback}</>;

  return <Image source={{ uri }} style={style} contentFit={contentFit} transition={transition} onError={() => setFailed(true)} />;
}
