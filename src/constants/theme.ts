/**
 * CrownSourceGlobal native design tokens (M19.2 theme-system reset).
 *
 * Two things live here:
 *
 *  1. Theme-INDEPENDENT tokens (Spacing, Radius, Type, IconSize,
 *     TouchTarget, FontFamily) — sizes and rhythm that don't change between
 *     light and dark. Screens import these directly, same as before.
 *
 *  2. Theme-DEPENDENT tokens (colors, shadows) — these now come in a real
 *     `light` and `dark` palette rather than a fixed "brand"/"commerce"
 *     split. A screen no longer decides "I am dark" or "I am light"; it
 *     asks the current theme (see src/hooks/useAppTheme.tsx) for its
 *     colors, and the same component renders correctly under either.
 *
 * This file is the only place a raw hex value should appear — screens and
 * components consume `useAppTheme().colors`, never a literal, with the
 * single documented exception of src/features/explore/devPostFixtures.ts
 * (throwaway placeholder-tile colors, deleted with that file once real
 * Explore content exists).
 *
 * Every text/bg color pair below was checked against WCAG AA (4.5:1 for
 * body text, 3:1 for large/bold text and non-text UI) — see the M19.2
 * report for the numbers. Two design decisions fell out of that check:
 *
 *  - `pink` in light mode is deliberately darker than the client board's
 *    own swatch (#D94F79 only cleared ~3.5:1 as text) — #C13A65 clears
 *    4.5:1 as text AND gives white button labels 5.17:1 as a fill, so one
 *    value does both jobs.
 *  - Dark mode can't do the same trick: a pink bright enough to read as
 *    TEXT on a near-black canvas (needed: high luminance) is too light for
 *    white button labels to sit on accessibly. So dark buttons use
 *    `textOnAccent` (a near-black label) on the pink fill instead of white
 *    — the same "onPrimary" pattern Material dark themes use, not a new
 *    idea. `pink` itself stays the bright text/icon color in dark mode.
 */

export type ColorScheme = "light" | "dark";

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/** Restrained radius scale — flat sections and hairline dividers do most of the work; radius is reserved for real surfaces (cards, sheets, pills). */
export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
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
 * @expo-google-fonts/playfair-display — see src/app/_layout.tsx) kept only
 * as a fallback where the official logo image isn't appropriate (e.g. a
 * plain-text context). The official CrownSourceGlobal logo (see
 * assets/branding/) is now the real wordmark everywhere brand identity
 * matters — see AppLogo.tsx.
 */
export const FontFamily = {
  display: "PlayfairDisplay_700Bold",
  displaySemibold: "PlayfairDisplay_600SemiBold",
  body: undefined,
} as const;

/**
 * Mobile type scale, sized for real 320–430px screens and real (long) API
 * data — not a concept-board headline scale. Hierarchy comes from
 * weight/spacing/color, not enormous type.
 *
 *   display        28  — brand wordmark fallback only
 *   screenTitle     22  — screen-level title ("Shop", "Explore", a vendor name)
 *   sectionHeading  17  — section headers within a screen
 *   cardTitle       14  — product/card/list-row title
 *   price / priceLg 16/19 — price emphasis
 *   body            14  — primary body copy
 *   small           12.5 — metadata / secondary text
 *   caption         11  — eyebrows, bottom-tab labels
 */
export const Type = {
  display: { fontFamily: FontFamily.display, fontSize: 28, lineHeight: 34 },
  screenTitle: { fontSize: 22, lineHeight: 27, fontWeight: "700" as const },
  sectionHeading: { fontSize: 17, lineHeight: 22, fontWeight: "700" as const },
  cardTitle: { fontSize: 14, lineHeight: 19, fontWeight: "600" as const },
  price: { fontSize: 16, lineHeight: 20, fontWeight: "700" as const },
  priceLarge: { fontSize: 19, lineHeight: 24, fontWeight: "700" as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  small: { fontSize: 12.5, lineHeight: 17, fontWeight: "400" as const },
  smallMedium: { fontSize: 12.5, lineHeight: 17, fontWeight: "600" as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "700" as const },
} as const;

export type ThemeColors = {
  bg: string;
  surface: string;
  elevated: string;
  surfaceSubtle: string;
  border: string;
  borderPremium: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Text/icons that must stay light regardless of theme (over a scrim/photo). */
  textInverse: string;
  /** Text/icons placed on top of the `pink` fill — white in light mode, near-black in dark mode. See file header. */
  textOnAccent: string;
  pink: string;
  pinkPressed: string;
  pinkSurface: string;
  gold: string;
  goldStrong: string;
  goldSurface: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  error: string;
  errorSurface: string;
  scrim: string;
};

const light: ThemeColors = {
  bg: "#F7F1EF",
  surface: "#FFFDFC",
  elevated: "#FFFFFF",
  surfaceSubtle: "#F1E7E3",
  border: "#E7DDDA",
  borderPremium: "rgba(198, 161, 91, 0.35)",
  textPrimary: "#211A1D",
  textSecondary: "#6E6167",
  textMuted: "#7A6B70",
  textInverse: "#FFFFFF",
  textOnAccent: "#FFFFFF",
  pink: "#C13A65",
  pinkPressed: "#A82F56",
  pinkSurface: "#FBE7ED",
  gold: "#C6A15B",
  goldStrong: "#8C6423",
  goldSurface: "#F5EBD8",
  success: "#276C42",
  successSurface: "#E3F1E7",
  warning: "#8A5E12",
  warningSurface: "#FBF0DD",
  error: "#A5333D",
  errorSurface: "#FBE9EA",
  scrim: "rgba(33, 26, 29, 0.55)",
};

const dark: ThemeColors = {
  bg: "#171214",
  surface: "#241C1F",
  elevated: "#302529",
  surfaceSubtle: "#1D1719",
  border: "#3D3236",
  borderPremium: "rgba(200, 164, 94, 0.30)",
  textPrimary: "#F7F1ED",
  textSecondary: "#BEB2B5",
  textMuted: "#8B7F82",
  textInverse: "#FFFFFF",
  textOnAccent: "#171214",
  pink: "#E15A84",
  pinkPressed: "#DC5480",
  pinkSurface: "#3A222A",
  gold: "#C8A45E",
  goldStrong: "#E4C687",
  goldSurface: "#362B22",
  success: "#4CA871",
  successSurface: "#1E2E24",
  warning: "#D9A441",
  warningSurface: "#332A1A",
  error: "#E2717A",
  errorSurface: "#35201F",
  scrim: "rgba(10, 8, 9, 0.6)",
};

export const Palette: Record<ColorScheme, ThemeColors> = { light, dark };

export type ThemeShadow = { card: object; raised: object };

/**
 * Dark mode intentionally does not lean on drop shadows — a shadow barely
 * reads against a near-black canvas, and Android's `elevation` prop draws
 * its own fixed dark shadow regardless of `shadowColor`. Depth in dark mode
 * comes from the surface/elevated tone step + a hairline border instead.
 */
export const Shadow: Record<ColorScheme, ThemeShadow> = {
  light: {
    card: {
      shadowColor: "#2B1E22",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    raised: {
      shadowColor: "#2B1E22",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 6,
    },
  },
  dark: {
    card: { shadowOpacity: 0, elevation: 0 },
    raised: { shadowOpacity: 0, elevation: 0 },
  },
};
