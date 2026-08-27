import { ENV } from "../env";
import { authClient, signOut } from "../auth/client";
import { ApiError, type ApiErrorCode } from "./errors";

/**
 * Small shared fetch client for `/api/v1/*`. Deliberately thin — it only
 * knows the M18 response envelope, not any CrownSourceGlobal business rule.
 * See docs/mobile/MOBILE_V1_PLAN.md §10-11 (this repo does not duplicate
 * that document; see ../crownsourceglobal for the source).
 */

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
};

type ApiEnvelope<T> = { data: T } | { error: { code: ApiErrorCode; message: string } };

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  if (!ENV.ok) {
    throw new ApiError("CONFIG_ERROR", ENV.message);
  }
  const url = new URL(`${ENV.apiBaseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);
  // `getCookie()` reads the session cookie @better-auth/expo already
  // persisted in SecureStore (see ../auth/client.ts) — empty string when
  // signed out, which is simply omitted below.
  const cookie = authClient.getCookie();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      signal: options.signal,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Could not reach the CrownSourceGlobal server. Check your connection and that EXPO_PUBLIC_API_BASE_URL points at a reachable backend.",
    );
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // fall through — body stays null, handled below
  }

  if (!response.ok) {
    const errorBody = body && "error" in body ? body.error : null;
    const code = errorBody?.code ?? "UNKNOWN_ERROR";
    // A previously-valid session went stale server-side (expired/revoked).
    // Drop the local copy so the app falls back to signed-out state instead
    // of repeatedly retrying a dead session (§21) — best-effort, never
    // blocks surfacing the original error to the caller.
    if (code === "UNAUTHORIZED") {
      signOut().catch(() => {});
    }
    throw new ApiError(code, errorBody?.message ?? "Something went wrong.", response.status);
  }

  if (!body || !("data" in body)) {
    throw new ApiError("UNKNOWN_ERROR", "The server returned an unexpected response.");
  }

  return body.data;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
};
