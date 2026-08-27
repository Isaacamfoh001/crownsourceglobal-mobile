/**
 * ============================================================================
 *  DEVELOPMENT-ONLY FIXTURE DATA — NOT PRODUCTION CONTENT
 * ============================================================================
 *
 * Explore is a visual discovery feed of beauty professionals' work
 * (hairstyles, wig installs, braiding, makeup, lashes, nails, salon
 * transformations) — see AGENTS.md §2/§9, M19.2 §8-12.
 *
 * That feed needs a real backend domain (provider posts + images + likes/
 * saves) that DOES NOT EXIST YET. There is no `/api/v1/explore-posts`
 * endpoint or equivalent to call.
 *
 * The array below exists ONLY so the ExplorePostCard / ExploreScreen layout
 * and interaction affordances (like/save) can be built and evaluated at
 * real screen widths before that backend domain ships. It is:
 *
 *   - isolated to this one file, imported only by the Explore screen
 *   - never merged into src/lib/api or any TanStack Query hook
 *   - rendered with an explicit "Preview layout — sample content" banner
 *     on screen, so nobody mistakes it for a live feed
 *   - deliberately NOT photographic: every "image" is a flat placeholder
 *     tile (color + icon), not a stock photo standing in for a real
 *     provider's work — no images of real beauty work exist anywhere in
 *     this repo or the supplied reference material to draw from, and nothing
 *     was downloaded from the internet to fill the gap
 *   - the like/save counts below are fixture numbers for evaluating the
 *     interaction row's appearance ONLY — never rendered outside this
 *     clearly-labelled preview screen, and the "liked"/"saved" state itself
 *     lives in local component state in ExploreScreen (resets on remount,
 *     no persistence, no API calls)
 *
 * DELETE THIS FILE the moment a real Explore/portfolio-post API exists and
 * wire ExploreScreen to that instead. See the backend contract proposal in
 * the M19 report for the shape that endpoint should return.
 */

export type DevExplorePostFixture = {
  id: string;
  title: string;
  providerName: string;
  location: string;
  categoryTag: string;
  placeholderIcon: "cut-outline" | "color-palette-outline" | "sparkles-outline" | "brush-outline" | "flower-outline";
  placeholderTint: "plum" | "gold" | "pink" | "ink";
  /** Fixture-only starting like count — see file header. */
  sampleLikeCount: number;
};

/**
 * Placeholder-tile colors for the fixtures below only. Deliberately kept
 * out of constants/theme.ts — theme.ts documents the production design
 * system, and these hexes exist solely to render throwaway sample tiles.
 * They disappear along with this file once real post images exist.
 */
export const DEV_TINT_STYLE: Record<DevExplorePostFixture["placeholderTint"], { bg: string; fg: string }> = {
  plum: { bg: "#EFE6F2", fg: "#6B4E76" },
  gold: { bg: "#F7EED9", fg: "#AD8544" },
  pink: { bg: "#FCE7EE", fg: "#C33765" },
  ink: { bg: "#E7E4E9", fg: "#453C4F" },
};

export const DEV_EXPLORE_POST_FIXTURES: DevExplorePostFixture[] = [
  {
    id: "dev-1",
    title: "Honey blonde frontal install",
    providerName: "Ama Hair Studio",
    location: "East Legon, Accra",
    categoryTag: "Wig Installation",
    placeholderIcon: "sparkles-outline",
    placeholderTint: "gold",
    sampleLikeCount: 214,
  },
  {
    id: "dev-2",
    title: "Knotless box braids, medium",
    providerName: "Braids by Naa",
    location: "Osu, Accra",
    categoryTag: "Braiding",
    placeholderIcon: "flower-outline",
    placeholderTint: "plum",
    sampleLikeCount: 132,
  },
  {
    id: "dev-3",
    title: "Soft glam bridal makeup",
    providerName: "Glow by Efua",
    location: "Kumasi",
    categoryTag: "Makeup",
    placeholderIcon: "color-palette-outline",
    placeholderTint: "pink",
    sampleLikeCount: 98,
  },
  {
    id: "dev-4",
    title: "Classic lash extension set",
    providerName: "Lash Lounge GH",
    location: "Takoradi",
    categoryTag: "Lashes",
    placeholderIcon: "sparkles-outline",
    placeholderTint: "ink",
    sampleLikeCount: 61,
  },
  {
    id: "dev-5",
    title: "Silk press, full head",
    providerName: "Royal Looks Salon",
    location: "East Legon, Accra",
    categoryTag: "Hairstyling",
    placeholderIcon: "cut-outline",
    placeholderTint: "plum",
    sampleLikeCount: 176,
  },
  {
    id: "dev-6",
    title: "Chrome French tip set",
    providerName: "Nail Bar Accra",
    location: "Cantonments, Accra",
    categoryTag: "Nails",
    placeholderIcon: "brush-outline",
    placeholderTint: "gold",
    sampleLikeCount: 84,
  },
];
