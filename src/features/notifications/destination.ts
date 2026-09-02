import type { Href } from "expo-router";

/**
 * Maps a Notification's `targetUrl` (an app-relative WEB path built by the
 * backend's modules/notifications/links.ts — e.g. "/account/orders/abc123")
 * to a real native Expo Router destination. Deliberately never reuses the
 * web path itself as a route (M28 §5) — the two apps' route trees don't
 * match, so a web path pushed directly on native would 404/crash.
 *
 * Matched by URL *shape* rather than by NotificationType: a handful of
 * types (e.g. FULFILMENT_ISSUE_RESOLVED) fan out to either a customer or a
 * vendor recipient with a different targetUrl shape depending who's
 * notified, so the shape of the path is the more reliable signal than the
 * type name alone — and every shape below is still one dedicated,
 * intentional mapping, never a blind pass-through.
 *
 * Returns `null` when the backend event has no corresponding native screen
 * yet (vendor messaging, vendor resolutions, vendor sourcing solicitations,
 * buyer/vendor messaging, and every /admin/* path — there is no admin
 * surface in this app at all). The notification itself must still render
 * and be markable read; only tap-to-navigate is unavailable — see the
 * Notifications screen, which disables the row's chevron/press affordance
 * when this returns null.
 */
export function resolveNotificationDestination(targetUrl: string): Href | null {
  for (const { pattern, build } of STATIC_ROUTES) {
    if (targetUrl === pattern) return build();
  }

  for (const { pattern, build } of ID_ROUTES) {
    const match = pattern.exec(targetUrl);
    if (match) return build(match[1]!);
  }

  for (const { pattern, build } of FALLBACK_ROUTES) {
    if (pattern.test(targetUrl)) return build();
  }

  return null;
}

const STATIC_ROUTES: { pattern: string; build: () => Href }[] = [
  { pattern: "/vendor/onboarding", build: () => "/vendor-onboarding" as Href },
  { pattern: "/vendor/portal", build: () => "/(vendor)" as Href },
  { pattern: "/vendor/portal/finance", build: () => "/(vendor)/finance" as Href },
  { pattern: "/vendor/portal/beauty-professional", build: () => "/vendor-beauty-professional" as Href },
];

const ID_ROUTES: { pattern: RegExp; build: (id: string) => Href }[] = [
  // Vendor Mode
  { pattern: /^\/vendor\/portal\/listings\/([^/]+)$/, build: (id) => `/vendor-listings/${id}` as Href },
  { pattern: /^\/vendor\/portal\/orders\/([^/]+)$/, build: (id) => `/vendor-orders/${id}` as Href },
  { pattern: /^\/vendor\/portal\/finance\/settlements\/([^/]+)$/, build: (id) => `/vendor-finance/settlements/${id}` as Href },
  { pattern: /^\/vendor\/portal\/beauty-professional\/requests\/([^/]+)$/, build: (id) => `/vendor-beauty-professional/requests/${id}` as Href },
  // Customer
  { pattern: /^\/account\/orders\/([^/]+)$/, build: (id) => `/orders/${id}` as Href },
  { pattern: /^\/account\/quotes\/([^/]+)$/, build: (id) => `/quotations/${id}` as Href },
  { pattern: /^\/account\/sourcing\/([^/]+)$/, build: (id) => `/sourcing/${id}` as Href },
  { pattern: /^\/account\/resolutions\/([^/]+)$/, build: (id) => `/resolutions/${id}` as Href },
];

/**
 * Paths whose backend id has no per-item mobile screen, but a real list
 * screen showing the same information does exist — landing there beats no
 * destination at all.
 */
const FALLBACK_ROUTES: { pattern: RegExp; build: () => Href }[] = [
  { pattern: /^\/account\/service-requests\/[^/]+$/, build: () => "/beauty-services/my-requests" as Href },
  { pattern: /^\/vendor\/portal\/explore\/[^/]+$/, build: () => "/vendor-explore-posts" as Href },
];
