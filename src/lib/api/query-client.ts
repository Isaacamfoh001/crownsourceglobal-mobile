import { QueryClient } from "@tanstack/react-query";

/**
 * TanStack Query is the server-state layer for this app (MOBILE_V1_PLAN.md
 * §24: "choose a well-supported server-state strategy... for example
 * TanStack Query if justified"). Justification: every screen in M19.0 is a
 * read-only GET against `/api/v1/*` that needs loading/error/retry,
 * response caching between tab switches (Home → Shop → back), and
 * eventual pagination/mutation-invalidation once cart/orders land — a
 * home-grown fetch+useState hook would end up re-implementing all of that
 * per screen. No custom caching layer is built here beyond this config.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
