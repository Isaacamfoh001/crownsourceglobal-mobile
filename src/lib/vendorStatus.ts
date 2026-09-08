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

export type ListingPresentationGroup = "all" | "live" | "inReview" | "draft";

const LISTING_GROUP_INFO: Record<Exclude<ListingPresentationGroup, "all">, StatusInfo> = {
  live: { label: "Live", tone: "success" },
  inReview: { label: "In review", tone: "gold" },
  draft: { label: "Draft", tone: "muted" },
};

/**
 * M32.3 §14 — collapses the two raw backend axes (`ListingApprovalStatus`,
 * `ListingStatus`) into the one plain-language group a vendor actually
 * needs to filter by: All / Live / In review / Draft. Backend state
 * machines are untouched; this is a presentation-only grouping consumed by
 * `(vendor)/listings.tsx`'s filter chips and per-row badge.
 *
 * `listingStatus === "DRAFT"` wins first (not published, regardless of any
 * prior review outcome); then any non-approved review outcome (PENDING/
 * CHANGES_REQUESTED/REJECTED) is "In review" — a rejected listing still
 * needs the vendor's attention, same as one awaiting review; everything
 * else (APPROVED, whether ACTIVE/INACTIVE/ARCHIVED) is "Live" — inventory/
 * visibility nuances like "Hidden" surface as a contextual inline tag, not
 * a top-level filter (§14's explicit instruction).
 */
function listingGroup(approvalStatus: string, listingStatus: string): Exclude<ListingPresentationGroup, "all"> {
  if (listingStatus === "DRAFT") return "draft";
  if (approvalStatus !== "APPROVED") return "inReview";
  return "live";
}

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

/**
 * M32.3 §15 — vendor-facing finance language, simplified. Internally
 * PENDING/WAITING_PERIOD/ON_HOLD/ELIGIBLE/INCLUDED_IN_SETTLEMENT are five
 * distinct backend states (still shown as-is to CrownSource Admin — see
 * modules/vendor-finance — this map is mobile-presentation only and
 * changes no backend state machine); to a vendor they all mean the same
 * thing — "not paid yet" — so they collapse to one plain-language
 * "Pending". PAID and CANCELLED are truthful and stay distinct.
 */
const EARNING_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "Pending", tone: "gold" },
  WAITING_PERIOD: { label: "Pending", tone: "gold" },
  ON_HOLD: { label: "Pending", tone: "gold" },
  ELIGIBLE: { label: "Pending", tone: "gold" },
  INCLUDED_IN_SETTLEMENT: { label: "Pending", tone: "gold" },
  PAID: { label: "Paid", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

/** M32.3 §15 — same collapse: DRAFT/APPROVED/PROCESSING are all still-waiting states from the vendor's point of view. FAILED stays distinct — it's actionable (see payout destination). */
const SETTLEMENT_STATUS: Record<string, StatusInfo> = {
  DRAFT: { label: "Pending", tone: "gold" },
  APPROVED: { label: "Pending", tone: "gold" },
  PROCESSING: { label: "Pending", tone: "gold" },
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

const SOURCING_SOLICITATION_STATUS: Record<string, StatusInfo> = {
  SENT: { label: "Awaiting your response", tone: "gold" },
  RESPONDED: { label: "You responded", tone: "success" },
  CANNOT_FULFIL: { label: "Marked cannot fulfil", tone: "muted" },
};

function resolve(map: Record<string, StatusInfo>, status: string): StatusInfo {
  return map[status] ?? { label: humanize(status), tone: "muted" };
}

export const vendorStatus = {
  application: (status: string) => resolve(VENDOR_APPLICATION_STATUS, status),
  listingApproval: (status: string) => resolve(LISTING_APPROVAL_STATUS, status),
  listing: (status: string) => resolve(LISTING_STATUS, status),
  listingGroup,
  listingGroupInfo: (group: Exclude<ListingPresentationGroup, "all">) => LISTING_GROUP_INFO[group],
  fulfilment: (status: string) => resolve(FULFILMENT_STATUS, status),
  earning: (status: string) => resolve(EARNING_STATUS, status),
  settlement: (status: string) => resolve(SETTLEMENT_STATUS, status),
  beautyProfile: (status: string) => resolve(BEAUTY_PROFILE_STATUS, status),
  serviceRequest: (status: string) => resolve(SERVICE_REQUEST_STATUS, status),
  sourcingSolicitation: (status: string) => resolve(SOURCING_SOLICITATION_STATUS, status),
};
