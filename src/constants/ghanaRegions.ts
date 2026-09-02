/**
 * Ghana regions (M24), hand-mirrored from
 * ../crownsourceglobal/modules/orders/types.ts's GHANA_REGIONS —
 * Order.deliveryInfo.region (used when accepting a quotation) only ever
 * validates against this exact list server-side, so this picker must offer
 * the identical set of strings.
 */
export const GHANA_REGIONS: readonly string[] = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;
