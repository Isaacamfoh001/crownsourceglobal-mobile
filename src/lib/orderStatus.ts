import type { TextTone } from "@/components/ui/Text";

/**
 * M26 — label/tone lookups for customer-facing order statuses. Reuses the
 * exact backend OrderDisplayStatus values (never a mobile-only status —
 * same rule lib/vendorStatus.ts already follows for vendor statuses) and
 * maps each to a short, humanized label and a semantic Text tone.
 */

type StatusInfo = { label: string; tone: TextTone };

const ORDER_DISPLAY_STATUS: Record<string, StatusInfo> = {
  ORDER_CONFIRMED: { label: "Order confirmed", tone: "gold" },
  PREPARING: { label: "Preparing", tone: "gold" },
  COLLECTED: { label: "Collected", tone: "gold" },
  IN_TRANSIT: { label: "In transit", tone: "gold" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "gold" },
  DELIVERED: { label: "Delivered", tone: "success" },
  ISSUE_UNDER_REVIEW: { label: "Issue under review", tone: "warning" },
  RETURN_IN_PROGRESS: { label: "Return in progress", tone: "warning" },
  REFUND_PROCESSING: { label: "Refund processing", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "muted" },
  PARTIALLY_REFUNDED: { label: "Partially refunded", tone: "warning" },
  REPLACEMENT_IN_PROGRESS: { label: "Replacement in progress", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

const PAYMENT_STATUS: Record<string, StatusInfo> = {
  UNPAID: { label: "Payment pending", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  PARTIALLY_REFUNDED: { label: "Partially refunded", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "muted" },
};

const PAYMENT_ATTEMPT_STATUS: Record<string, StatusInfo> = {
  INITIATED: { label: "Payment starting", tone: "muted" },
  PENDING: { label: "Payment processing", tone: "gold" },
  SUCCEEDED: { label: "Paid", tone: "success" },
  FAILED: { label: "Payment failed", tone: "error" },
  CANCELLED: { label: "Payment cancelled", tone: "muted" },
};

const RESOLUTION_CASE_STATUS: Record<string, StatusInfo> = {
  OPEN: { label: "Open", tone: "warning" },
  UNDER_REVIEW: { label: "Under review", tone: "gold" },
  AWAITING_CUSTOMER: { label: "Awaiting you", tone: "warning" },
  AWAITING_VENDOR: { label: "Awaiting vendor", tone: "gold" },
  RESOLUTION_APPROVED: { label: "Resolution approved", tone: "gold" },
  RESOLUTION_IN_PROGRESS: { label: "Resolution in progress", tone: "gold" },
  RESOLVED: { label: "Resolved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "muted" },
  CLOSED: { label: "Closed", tone: "muted" },
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function resolve(map: Record<string, StatusInfo>, status: string): StatusInfo {
  return map[status] ?? { label: humanize(status), tone: "muted" };
}

export const orderStatus = {
  display: (status: string) => resolve(ORDER_DISPLAY_STATUS, status),
  payment: (status: string) => resolve(PAYMENT_STATUS, status),
  paymentAttempt: (status: string) => resolve(PAYMENT_ATTEMPT_STATUS, status),
  resolutionCase: (status: string) => resolve(RESOLUTION_CASE_STATUS, status),
};
