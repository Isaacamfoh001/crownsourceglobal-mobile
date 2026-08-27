import { ENV } from "../env";
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
  /** Bearer token for a future authenticated call — unused by any M19.0 screen, wired for later milestones. */
  token?: string | null;
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

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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
    throw new ApiError(
      errorBody?.code ?? "UNKNOWN_ERROR",
      errorBody?.message ?? "Something went wrong.",
      response.status,
    );
  }

  if (!body || !("data" in body)) {
    throw new ApiError("UNKNOWN_ERROR", "The server returned an unexpected response.");
  }

  return body.data;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
};
