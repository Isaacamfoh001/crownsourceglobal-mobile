/**
 * Better Auth's client error shape (a parsed error-response body, not a
 * thrown exception — every `authClient.*` call resolves to `{ data, error }`
 * rather than rejecting on an auth failure). `code` mirrors the string keys
 * in @better-auth/core's BASE_ERROR_CODES; `message` is that code's default
 * English copy, which is NOT user-safe on its own (M20.2 §8/§26 — never
 * show a raw Better Auth error). This module is the one place that copy
 * gets translated.
 */
export type AuthClientError = { code?: string; message?: string; status?: number } | null | undefined;

function codeOf(error: AuthClientError): string | undefined {
  return error?.code ?? error?.message;
}

export function isEmailNotVerifiedError(error: AuthClientError): boolean {
  return codeOf(error) === "EMAIL_NOT_VERIFIED";
}

export function friendlyAuthErrorMessage(error: AuthClientError): string {
  switch (codeOf(error)) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email or password isn't right. Please try again.";
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email before signing in.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Try signing in instead.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "INVALID_PASSWORD":
      return "That password isn't correct.";
    case "PASSWORD_TOO_SHORT":
      return "Your password is too short.";
    case "PASSWORD_TOO_LONG":
      return "Your password is too long.";
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return "That link has expired or is invalid. Please request a new one.";
    default:
      return "Something went wrong. Please try again.";
  }
}
