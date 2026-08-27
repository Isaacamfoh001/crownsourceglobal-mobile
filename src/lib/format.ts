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

export function formatSellerType(sellerType: string | null): string | null {
  if (!sellerType) return null;
  return sellerType
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
