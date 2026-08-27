import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

/**
 * The official CrownSourceGlobal logo. The client supplied it as a single
 * flattened PNG (1080×562, solid black background, no alpha channel) —
 * still preserved untouched at docs/reference/crownsourcelogo.png and
 * assets/branding/crownsourceglobal-logo.png. M19.2.2 derives a transparent
 * RGBA sibling from that exact source (assets/branding/crownsourceglobal-
 * logo-transparent.png — see the M19.2.2 report for the extraction method)
 * and renders that here instead: uniformly scaled by width only (never
 * stretched/cropped/distorted/recolored), with `contentFit="contain"` as a
 * second guarantee against distortion.
 *
 * The gold artwork still wants real contrast, so it's a *design* choice to
 * keep placing it on a dark surface (e.g. Home's dark hero band — see
 * src/app/(tabs)/index.tsx) — but that's no longer a *technical* requirement
 * the way it was with the baked-black original: nothing paints a visible box
 * if a future surface isn't pure black.
 */
export const LOGO_ASPECT_RATIO = 1080 / 562;

const logoSource = require("../../../assets/branding/crownsourceglobal-logo-transparent.png");

type AppLogoProps = {
  width?: number;
  style?: StyleProp<ImageStyle>;
};

export function AppLogo({ width = 220, style }: AppLogoProps) {
  return (
    <Image
      source={logoSource}
      accessibilityLabel="CrownSourceGlobal"
      style={[{ width, height: width / LOGO_ASPECT_RATIO }, style]}
      contentFit="contain"
    />
  );
}
