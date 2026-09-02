import type { TextTone } from "@/components/ui/Text";

/**
 * M27 — label/tone lookups for every vendor-facing status enum. Reuses the
 * exact backend enum values (never a mobile-only status, per M27 §7's
 * "use existing lifecycle terminology exactly" rule) and maps each to a
 * short, humanized label and a semantic Text tone for StatusBadge.
 */

type StatusInfo = { label: string; tone: TextTone };

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

const VENDOR_APPLICATION_STATUS: Record<string, StatusInfo> = {
  DRAFT: { label: "Draft", tone: "muted" },
  SUBMITTED: { label: "Submitted", tone: "gold" },
  UNDER_REVIEW: { label: "Under review", tone: "gold" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "error" },
};

const LISTING_APPROVAL_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "Pending review", tone: "gold" },
  APPROVED: { label: "Approved", tone: "success" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "error" },
};

const LISTING_STATUS: Record<string, StatusInfo> = {
  DRAFT: { label: "Draft", tone: "muted" },
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Hidden", tone: "muted" },
  ARCHIVED: { label: "Archived", tone: "muted" },
};

const FULFILMENT_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "New", tone: "gold" },
  ACCEPTED: { label: "Accepted", tone: "gold" },
  PREPARING: { label: "Preparing", tone: "gold" },
  READY: { label: "Ready", tone: "gold" },
  DISPATCHED: { label: "Dispatched", tone: "success" },
  DELIVERED: { label: "Delivered", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  EXCEPTION: { label: "Issue reported", tone: "error" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

const EARNING_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "Pending", tone: "muted" },
  WAITING_PERIOD: { label: "Waiting period", tone: "gold" },
  ON_HOLD: { label: "On hold", tone: "warning" },
  ELIGIBLE: { label: "Eligible", tone: "success" },
  INCLUDED_IN_SETTLEMENT: { label: "In settlement", tone: "gold" },
  PAID: { label: "Paid", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

const SETTLEMENT_STATUS: Record<string, StatusInfo> = {
  DRAFT: { label: "Draft", tone: "muted" },
  APPROVED: { label: "Approved", tone: "gold" },
  PROCESSING: { label: "Processing", tone: "gold" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "error" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

const BEAUTY_PROFILE_STATUS: Record<string, StatusInfo> = {
  DRAFT: { label: "Draft", tone: "muted" },
  PENDING: { label: "Pending review", tone: "gold" },
  APPROVED: { label: "Approved", tone: "success" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "error" },
  ARCHIVED: { label: "Archived", tone: "muted" },
};

const SERVICE_REQUEST_STATUS: Record<string, StatusInfo> = {
  SUBMITTED: { label: "New request", tone: "gold" },
  PROVIDER_ACCEPTED: { label: "Accepted", tone: "success" },
  PROVIDER_DECLINED: { label: "Declined", tone: "muted" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

function resolve(map: Record<string, StatusInfo>, status: string): StatusInfo {
  return map[status] ?? { label: humanize(status), tone: "muted" };
}

export const vendorStatus = {
  application: (status: string) => resolve(VENDOR_APPLICATION_STATUS, status),
  listingApproval: (status: string) => resolve(LISTING_APPROVAL_STATUS, status),
  listing: (status: string) => resolve(LISTING_STATUS, status),
  fulfilment: (status: string) => resolve(FULFILMENT_STATUS, status),
  earning: (status: string) => resolve(EARNING_STATUS, status),
  settlement: (status: string) => resolve(SETTLEMENT_STATUS, status),
  beautyProfile: (status: string) => resolve(BEAUTY_PROFILE_STATUS, status),
  serviceRequest: (status: string) => resolve(SERVICE_REQUEST_STATUS, status),
};
