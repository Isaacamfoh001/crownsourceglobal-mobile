/**
 * M32.5 — mirrors ../crownsourceglobal/prisma/reference-data.ts's
 * `OTHER_CATEGORY_SLUG` exactly. The shared "Other / Not listed" Category
 * every category picker (Beauty service, Seller listing) offers as a
 * synthetic last option — selecting it reveals a free-text field instead of
 * a real category, and the backend resolves the real categoryId from the
 * paired `categoryOther` text server-side (see beauty-services/service.ts
 * and vendor-listings/service.ts's own `resolveCategory`).
 */
export const OTHER_CATEGORY_SLUG = "other";
export const OTHER_CATEGORY_LABEL = "Other / Not listed";
