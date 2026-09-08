import { Image, type ImageContentFit, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";
import { useAttachmentImageUri } from "@/lib/media/useAttachmentImageUri";

type AttachmentImageProps = {
  /** A private sourcing/resolution attachment URL (session-authenticated on the backend) — never a public listing/explore/service image (those still use a bare `{ uri }`, see FallbackImage). */
  url: string;
  style: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  transition?: number;
};

/**
 * Renders a private attachment (sourcing-request photo, resolution
 * evidence photo) safely on native — see useAttachmentImageUri's doc
 * comment for why this can't be a bare `expo-image` `{ uri, headers }`
 * source. While the authenticated fetch-and-cache is in flight, this
 * simply renders nothing (the caller's own placeholder background color,
 * already used throughout this app for image containers, shows through);
 * a real load failure also renders nothing rather than a broken-image icon
 * — same "never crash the surrounding card" principle as FallbackImage.
 */
export function AttachmentImage({ url, style, contentFit = "cover", transition }: AttachmentImageProps) {
  const { data: uri } = useAttachmentImageUri(url);
  if (!uri) return null;
  return <Image source={{ uri }} style={style} contentFit={contentFit} transition={transition} />;
}
