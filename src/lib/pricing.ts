import type { BulkPriceTierDTO, Money } from "@/types/api";

/**
 * Client-side preview only — mirrors the backend's
 * modules/pricing/resolveUnitPrice.ts shape (same tier-matching rule: the
 * highest tier whose minQuantity the requested quantity meets) so the
 * quantity stepper shows an honest live price as the customer adjusts it.
 * Never authoritative: checkout always re-resolves price server-side from
 * live VendorListing/BulkPriceTier data (CLAUDE.md §12).
 */
export function resolveDisplayUnitPrice(basePrice: Money, tiers: BulkPriceTierDTO[], quantity: number): Money {
  let applicable: BulkPriceTierDTO | null = null;
  for (const tier of tiers) {
    if (quantity < tier.minQuantity) continue;
    if (tier.maxQuantity !== null && quantity > tier.maxQuantity) continue;
    if (!applicable || tier.minQuantity > applicable.minQuantity) applicable = tier;
  }
  return applicable ? applicable.unitPrice : basePrice;
}
