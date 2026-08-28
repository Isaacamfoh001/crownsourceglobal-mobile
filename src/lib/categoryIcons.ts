import { Ionicons } from "@expo/vector-icons";

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Shop's category rail has no image/icon field on the real Category row
 * (prisma/schema.prisma — `id/name/slug/parentCategoryId` only), so a
 * line-icon-per-slug mapping is the honest way to give the rail visual
 * variety without inventing photography (M22.3 §5). Keyed against the
 * canonical top-level slugs in ../crownsourceglobal/prisma/reference-data.ts
 * — unrecognized/future slugs fall back to a neutral icon rather than
 * breaking, since this list is not the source of truth for what
 * categories exist.
 */
const CATEGORY_ICONS: Record<string, IoniconName> = {
  "hair-wigs": "cut-outline",
  wigs: "cut-outline",
  "closures-frontals": "cut-outline",
  "bundles-extensions": "layers-outline",
  "human-hair-bundles": "layers-outline",
  "clip-ins-weaves": "layers-outline",
  "lashes-brows": "eye-outline",
  "makeup-cosmetics": "color-palette-outline",
  "hair-beauty-care": "leaf-outline",
  skincare: "water-outline",
  "hair-care": "leaf-outline",
  "beauty-tools-accessories": "construct-outline",
  "salon-professional": "storefront-outline",
};

const DEFAULT_CATEGORY_ICON: IoniconName = "pricetag-outline";

export function getCategoryIcon(slug: string): IoniconName {
  return CATEGORY_ICONS[slug] ?? DEFAULT_CATEGORY_ICON;
}
