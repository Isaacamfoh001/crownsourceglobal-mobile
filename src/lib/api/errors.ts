export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "CONFIG_ERROR"
  | "UNKNOWN_ERROR";

/** Thrown by the API client for both server-returned errors and local failures (network/config) so every call site can branch on one type. */
export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** User-safe copy for an ApiError — never the raw message from an unknown/internal failure. */
export function friendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "NETWORK_ERROR") {
      return "Can't reach CrownSourceGlobal right now. Check your connection and try again.";
    }
    if (error.code === "CONFIG_ERROR") {
      return error.message;
    }
    if (error.code === "NOT_FOUND") {
      return "We couldn't find that.";
    }
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return "You need to sign in to see this.";
    }
    if (error.code === "RATE_LIMITED") {
      return "Too many attempts. Please try again shortly.";
    }
    return error.message || "Something went wrong.";
  }
  return "Something went wrong. Please try again.";
}
