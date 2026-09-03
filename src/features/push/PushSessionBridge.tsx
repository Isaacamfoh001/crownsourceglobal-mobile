import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { syncIfAlreadyGranted } from "@/lib/push/registration";
import { usePushNotificationEvents } from "./usePushNotificationEvents";

/**
 * Headless, mounted once at the app root (M31). Renders nothing — it only
 * wires two session-lifecycle effects that must run exactly once
 * regardless of how many screens call `useAuth()`:
 *  - on sign-in (and on every cold start while already signed in), a
 *    silent, no-prompt device re-registration (never requests permission
 *    itself — see registration.ts's doc comment);
 *  - the push tap/foreground listeners, active only while signed in (a
 *    signed-out device has nothing to navigate to and nothing to
 *    refresh).
 */
export function PushSessionBridge() {
  const { status } = useAuth();
  const signedIn = status === "SIGNED_IN";

  useEffect(() => {
    if (signedIn) void syncIfAlreadyGranted();
  }, [signedIn]);

  usePushNotificationEvents(signedIn);

  return null;
}
