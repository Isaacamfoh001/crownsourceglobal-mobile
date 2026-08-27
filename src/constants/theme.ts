/**
 * CrownSourceGlobal native design tokens (M19.0).
 *
 * Derived from the client's supplied mobile concept board
 * (docs/reference/client-mobile-mockup.png), which establishes two
 * deliberate, coexisting surface modes rather than one flat palette:
 *
 *  - "brand" (dark): the flagship canvas — used by Home, the screen meant
 *    to feel like stepping into CrownSourceGlobal's premium identity. Near-
 *    black background, gold identity/framing, warm-white type.
 *  - "commerce" (light): the browsing canvas — used by Shop, Explore,
 *    Product Detail and the Vendor storefront. Warm off-white background,
 *    near-black type, pink as the interaction/CTA color.
 *
 * Gold = brand/premium/identity. Pink = interaction/commerce/CTA. Neither
 * replaces the other, and neither is used decoratively — see each token's
 * name for its intended role. This file is the only place a raw hex value
 * should appear; screens/components consume these tokens, never literals.
 */

export const Color = {
  brand: {
    bg: "#0E0C11",
    surface: "#1A1620",
    surfaceAlt: "#241F2C",
    border: "rgba(203, 164, 92, 0.30)",
    textPrimary: "#F8F4EC",
    textSecondary: "#B6AEC2",
  },
  commerce: {
    bg: "#FAF7F2",
    surface: "#FFFFFF",
    surfaceSubtle: "#F1ECE4",
    border: "#E7E1D6",
    textPrimary: "#1C1720",
    textSecondary: "#726B78",
    textMuted: "#9C95A3",
  },
  gold: "#CBA45C",
  goldStrong: "#AD8544",
  goldOnDark: "#E4C687",
  pink: "#E3487A",
  pinkPressed: "#C33765",
  pinkSurface: "#FCE7EE",
  inverseText: "#FFFFFF",
  success: "#3E8A5B",
  successSurface: "#E7F3EC",
  warning: "#B8842E",
  warningSurface: "#FBF0DD",
  error: "#C6404A",
  errorSurface: "#FBE9EA",
  scrim: "rgba(12, 9, 14, 0.55)",
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Minimum comfortable touch target (Apple HIG / Material both land around here). */
export const TouchTarget = 44;

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/**
 * One display/brand face (Playfair Display, loaded via
 * @expo-google-fonts/playfair-display — see src/app/_layout.tsx) for the
 * wordmark and hero headlines, and the platform system font for everything
 * else. Font loading is non-blocking past a short timeout — see
 * useAppFonts — so a slow font fetch never leaves the app stuck on the
 * splash screen.
 */
export const FontFamily = {
  display: "PlayfairDisplay_700Bold",
  displaySemibold: "PlayfairDisplay_600SemiBold",
  body: undefined,
} as const;

export const Type = {
  display: { fontFamily: FontFamily.display, fontSize: 30, lineHeight: 36 },
  h1: { fontFamily: FontFamily.displaySemibold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: FontFamily.displaySemibold, fontSize: 19, lineHeight: 25 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "700" as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const },
  bodyMedium: { fontSize: 15, lineHeight: 21, fontWeight: "600" as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  smallMedium: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: "600" as const },
} as const;

export const Shadow = {
  card: {
    shadowColor: "#171123",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  raised: {
    shadowColor: "#171123",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
} as const;
