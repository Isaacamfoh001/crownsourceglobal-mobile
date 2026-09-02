import { prepareImage, type PickedImageAsset } from "@/lib/media/prepareImage";
import type { TalentWorkSamplePhoto } from "./useSubmitTalentApplication";

/**
 * M24 — thin Careers-specific wrapper over the shared `prepareImage`
 * utility (extracted from this file so Source's photo-sourcing flow could
 * reuse the exact same proven resize/recompress pipeline without a second
 * implementation). Behavior is unchanged from before the extraction — same
 * 1600px/0.7 JPEG settings, same fallback-on-failure behavior.
 */
export async function prepareWorkPhoto(asset: PickedImageAsset): Promise<TalentWorkSamplePhoto> {
  return prepareImage(asset, "work");
}
