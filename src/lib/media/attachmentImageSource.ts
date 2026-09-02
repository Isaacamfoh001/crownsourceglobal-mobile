import { authClient } from "@/lib/auth/client";

/**
 * Sourcing-request attachments are served by an EXISTING private,
 * session-authenticated route (app/api/sourcing/attachments/[id] on the
 * backend — see lib/api/dto/sourcing.ts's absoluteSourcingAttachmentUrl
 * doc comment), unlike every other image type this app renders (listing/
 * explore-post/service-request images, which use the unauthenticated-but-
 * unguessable-key convention and load with a bare `{ uri }`). A browser
 * attaches its session cookie to an `<img>` request automatically; a
 * native `expo-image` does not, so the same cookie `src/lib/api/client.ts`
 * already attaches to every `/api/v1/*` fetch must be attached here too, or
 * every attachment thumbnail/gallery image 401s.
 */
export function attachmentImageSource(url: string): { uri: string; headers?: Record<string, string> } {
  const cookie = authClient.getCookie();
  return cookie ? { uri: url, headers: { Cookie: cookie } } : { uri: url };
}
