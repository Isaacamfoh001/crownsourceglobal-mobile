import { useEffect, useRef } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { NOTIFICATIONS_QUERY_KEY, UNREAD_COUNT_QUERY_KEY } from "@/features/notifications/useNotifications";
import { resolveNotificationDestination } from "@/features/notifications/destination";

function stringField(data: unknown, key: string): string | null {
  if (data && typeof data === "object" && key in data) {
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  return null;
}

/**
 * Handles a tapped push (foreground, background, or cold-start-from-killed)
 * by reusing the EXACT same destination allowlist the in-app inbox already
 * uses (M31 §9) — a push payload's `targetUrl` is never pushed as a route
 * directly, and an unrecognized shape opens the Notifications inbox
 * instead of crashing or doing nothing. `notificationId`, if present, is
 * marked read the same way tapping the equivalent inbox row already does.
 */
function openPushDestination(data: unknown) {
  const notificationId = stringField(data, "notificationId");
  if (notificationId) {
    apiClient.post(`/api/v1/notifications/${notificationId}/read`).catch(() => {});
  }
  const targetUrl = stringField(data, "targetUrl");
  const destination = targetUrl ? resolveNotificationDestination(targetUrl) : null;
  router.push(destination ?? "/notifications");
}

/**
 * Mounted once at the app root (M31). Two independent effects:
 *  - a push arriving while the app is foregrounded invalidates the same
 *    react-query caches the bell badge/inbox already read from (M31 §10 —
 *    the in-app inbox stays the source of truth and simply refreshes,
 *    rather than layering a second competing UI on top of the OS banner
 *    the notification handler already suppresses);
 *  - a tapped push (background or a cold start from a fully killed app,
 *    the latter via `getLastNotificationResponseAsync`) navigates via
 *    `openPushDestination` above.
 */
export function usePushNotificationEvents(enabled: boolean) {
  const queryClient = useQueryClient();
  const consumedColdStart = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openPushDestination(response.notification.request.content.data);
    });

    if (!consumedColdStart.current) {
      consumedColdStart.current = true;
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) openPushDestination(response.notification.request.content.data);
      });
    }

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [enabled, queryClient]);
}
