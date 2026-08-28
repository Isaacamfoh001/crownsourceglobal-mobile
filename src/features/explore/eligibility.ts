import type { MeResponseDTO } from "@/types/api";

/**
 * Whether the signed-in user may post to Explore (M21) — mirrors the
 * backend's own eligibility check (modules/explore-posts/policy.ts's
 * `resolveExplorePostPublisher`: an APPROVED Vendor membership). This is a
 * UI-affordance check ONLY (whether to show the "share your work" button) —
 * the backend independently re-verifies on every mutating request, per
 * CLAUDE.md's "never trust UI hiding" rule.
 */
export function isEligibleExploreProvider(me: MeResponseDTO | null): boolean {
  return me?.vendor.memberships.some((membership) => membership.verificationStatus === "APPROVED") ?? false;
}
