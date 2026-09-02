import type { Ionicons } from "@expo/vector-icons";
import type { NotificationType } from "@/types/api";

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Contextual icon per NotificationType (M28 §6) — grouped by domain rather
 * than one icon per enum value, since most groups share one visual idea
 * (e.g. every delivery-progress type reads as "package"). Ordered
 * most-specific-first; falls back to a plain bell.
 */
export function notificationIcon(type: NotificationType): IconName {
  if (type.startsWith("VENDOR_APPLICATION_")) return "briefcase-outline";
  if (type.startsWith("LISTING_")) return "pricetag-outline";
  if (type === "ORDER_CONFIRMED" || type === "VENDOR_NEW_ORDER") return "receipt-outline";
  if (type === "DELIVERY_ISSUE") return "alert-circle-outline";
  if (type === "FULFILMENT_ISSUE_RESOLVED") return "checkmark-circle-outline";
  if (["COLLECTION_SCHEDULED", "PACKAGE_COLLECTED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(type)) return "cube-outline";
  if (type === "QUOTE_ISSUED") return "document-text-outline";
  if (type.startsWith("SOURCING_") || type === "VENDOR_SOURCING_SOLICITATION_RECEIVED" || type === "ADMIN_SOURCING_SOLICITATION_RESPONDED") return "earth-outline";
  if (type === "STAFF_REPLY" || type === "VENDOR_STAFF_REPLY" || type === "ADMIN_NEW_MESSAGE") return "chatbubble-ellipses-outline";
  if (type.startsWith("RESOLUTION_") || type === "RETURN_APPROVED" || type === "REFUND_APPROVED" || type === "REFUND_COMPLETED" || type === "REPLACEMENT_CREATED" || type === "ADMIN_NEW_RESOLUTION_CASE" || type === "ADMIN_REFUND_FAILED")
    return "shield-checkmark-outline";
  if (type === "PAYMENT_FAILED" || type === "ADMIN_PAYMENT_REQUIRES_ATTENTION") return "card-outline";
  if (type.startsWith("VENDOR_EARNING_") || type.startsWith("VENDOR_SETTLEMENT_")) return "cash-outline";
  if (type === "ADMIN_NEW_TALENT_APPLICATION") return "briefcase-outline";
  if (type.startsWith("EXPLORE_POST_")) return "images-outline";
  if (type.startsWith("BEAUTY_PROFESSIONAL_")) return "sparkles-outline";
  if (type.startsWith("SERVICE_REQUEST_")) return "sparkles-outline";
  if (type.startsWith("ADMIN_NEW_VENDOR_APPLICATION") || type.startsWith("ADMIN_NEW_SOURCING_REQUEST")) return "shield-outline";
  return "notifications-outline";
}

/** True when `iso` falls on today's calendar date, local time — the Today/Earlier split (M28 §6). */
export function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
