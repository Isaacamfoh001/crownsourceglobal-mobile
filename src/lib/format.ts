import type { Money } from "../types/api";

/**
 * Money is always a `{ amount, currency }` string pair over the wire — this
 * only formats it for display, never converts it to a float for math
 * (MOBILE_V1_PLAN.md §11/§17: the server remains authoritative on totals).
 */
export function formatMoney(money: Money): string {
  const value = Number(money.amount);
  const symbol = money.currency === "GHS" ? "GHS " : `${money.currency} `;
  if (!Number.isFinite(value)) return `${symbol}${money.amount}`;
  return `${symbol}${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatAvailability(status: string): string {
  switch (status) {
    case "IN_STOCK":
      return "In stock";
    case "LOW_STOCK":
      return "Low stock";
    case "OUT_OF_STOCK":
      return "Out of stock";
    case "MADE_TO_ORDER":
      return "Made to order";
    default:
      return status;
  }
}

/**
 * Compact relative time for Explore captions ("2h", "3d", "5w") — falls
 * back to a short absolute date past ~6 weeks so old posts don't show an
 * absurd "38w". Deliberately coarse (no minutes/seconds): a beauty-work
 * post doesn't need second-precision freshness.
 */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 6) return `${weeks}w`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatSellerType(sellerType: string | null): string | null {
  if (!sellerType) return null;
  return sellerType
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
