import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "./useAuth";

/**
 * Vendor Mode's entry guard (M27 §3/§23), shared by the tab shell and
 * every top-level vendor-* detail screen reachable via a direct
 * deep-link. Gated on `me.vendor.available` (an APPROVED VendorMembership
 * — GET /api/v1/me), same source of truth every `/api/v1/vendor/*` route
 * independently re-checks server-side; this is a UI-affordance guard
 * only, matching Explore's own eligibility-check convention. Same User,
 * same session — never a second authentication surface.
 */
export function useVendorModeGuard() {
  const { status, me, isMeLoading } = useAuth();
  const ready = status === "SIGNED_IN" && !isMeLoading && Boolean(me);
  const isVendor = Boolean(me?.vendor.available);

  useEffect(() => {
    if (status === "SIGNED_OUT") {
      router.replace("/(auth)/sign-in");
    } else if (ready && !isVendor) {
      router.replace("/(tabs)/account");
    }
  }, [status, ready, isVendor]);

  return { ready: ready && isVendor };
}
