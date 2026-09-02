import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export type PickedImageAsset = {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string | null;
  fileName?: string | null;
};

export type PreparedImage = { uri: string; mimeType: string; fileName: string };

// A real, un-downscaled photo straight off a modern iPhone camera (12-48MP)
// can be several MB even at expo-image-picker's own `quality: 0.8` JPEG
// compression, because that option only controls JPEG compression, not
// pixel dimensions. Requiring several of those in one multipart body pushed
// real submissions into the tens-of-MB range on a physical device — which
// is what actually caused the M23.3 real-device bug report ("Can't reach
// CrownSourceGlobal"): React Native's networking layer threw before any
// response ever arrived, which apiClient correctly (if unhelpfully-looking)
// surfaces as NETWORK_ERROR, since no HTTP response was ever received to
// classify otherwise. It looked like a connectivity problem; it was
// actually a payload-size problem.
//
// Downscaling every photo to a sane on-screen review size before it ever
// enters a FormData body fixes this at the root — a normal-review photo
// doesn't need original camera resolution, and every existing web/admin
// surface just displays it in a grid or thumbnail, at most a few hundred px
// across. This also incidentally normalizes format to JPEG, so an iOS
// library asset reported as HEIC always lands within a PNG/JPEG/WEBP
// backend allowlist rather than failing a separate MIME-type validation.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

function resizeTarget(width?: number, height?: number): { width?: number; height?: number } | undefined {
  if (!width || !height) return undefined;
  if (Math.max(width, height) <= MAX_DIMENSION) return undefined;
  return width >= height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION };
}

/**
 * Resize + recompress one picked photo before it's added to a FormData body
 * (M23.4, generalized M24 for reuse beyond Careers work samples — see
 * Source's photo-sourcing flow). Never converts to base64 and never
 * introduces a new upload mechanism — the result is still a real local file
 * `uri`, appended to FormData the same
 * `new File(photo.uri)` way every caller already uses (see
 * useSubmitTalentApplication.ts's doc comment for why that specific shape
 * is required by this app's Expo Winter fetch). If manipulation itself
 * fails for any reason (rare — a corrupt/unsupported source file), falls
 * back to the original picked asset rather than blocking the submission;
 * the backend still re-validates type/size regardless (defense in depth,
 * not this function's job alone).
 */
export async function prepareImage(asset: PickedImageAsset, baseNamePrefix: string): Promise<PreparedImage> {
  const fallback: PreparedImage = {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
    fileName: asset.fileName ?? `${baseNamePrefix}-${Date.now()}.jpg`,
  };

  try {
    const target = resizeTarget(asset.width, asset.height);
    let context = ImageManipulator.manipulate(asset.uri);
    if (target) context = context.resize(target);
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
    const baseName = (asset.fileName ?? `${baseNamePrefix}-${Date.now()}`).replace(/\.\w+$/, "");
    return { uri: result.uri, mimeType: "image/jpeg", fileName: `${baseName}.jpg` };
  } catch {
    return fallback;
  }
}
