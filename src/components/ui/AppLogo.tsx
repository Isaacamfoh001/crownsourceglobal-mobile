import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

/**
 * The official CrownSourceGlobal logo (M19.2 addendum) — supplied by the
 * client as a single flattened PNG (1080×562, solid black background, no
 * alpha channel). It is rendered here exactly as supplied: uniformly
 * scaled by width only (never stretched/cropped/distorted/recolored), with
 * `contentFit="contain"` as a second guarantee against distortion.
 *
 * Because the file has a solid black background baked in (not transparent),
 * it only reads as "logo, no box" when placed on a canvas at least as dark
 * as the image's own black — i.e. a dark surface. It is NOT used directly
 * on a light background anywhere in this app; see Home's dark hero band
 * (src/app/(tabs)/index.tsx), which exists specifically so this asset has
 * a surface it can sit on in both the light and dark app themes. See the
 * M19.2 report for why a light-theme-safe / small-format version (for a
 * tab-bar-sized mark, a notification icon, etc.) will need a separate,
 * purpose-cut asset from the client rather than a crop of this one.
 */
const LOGO_ASPECT_RATIO = 1080 / 562;

const logoSource = require("../../../assets/branding/crownsourceglobal-logo.png");

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
