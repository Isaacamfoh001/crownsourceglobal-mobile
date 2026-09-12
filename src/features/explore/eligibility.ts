import type { MeResponseDTO } from "@/types/api";

/**
 * Whether the signed-in user may post to Explore (M32.10) — mirrors the
 * backend's own eligibility check (modules/explore-posts/policy.ts's
 * `resolveExplorePostPublisher`: an APPROVED Vendor membership that ALSO
 * has approved Beauty Professional access). Explore is a Beauty-
 * professional authoring surface, not a general vendor one — an ordinary
 * Seller or a Factory/Manufacturer without Beauty access must not see the
 * "+" affordance, even though their vendor membership is otherwise
 * approved. This is a UI-affordance check ONLY (whether to show the "share
 * your work" button) — the backend independently re-verifies on every
 * mutating request, per CLAUDE.md's "never trust UI hiding" rule.
 */
export function isEligibleExploreProvider(me: MeResponseDTO | null): boolean {
  return (
    me?.vendor.memberships.some(
      (membership) => membership.verificationStatus === "APPROVED" && membership.beautyProfessional.available,
    ) ?? false
  );
}
