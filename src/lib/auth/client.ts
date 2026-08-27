import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { ENV } from "@/lib/env";

/**
 * The one Better Auth client for this app — every screen signs in/up/out
 * and reads session state through this module, never a raw `/api/auth/*`
 * fetch (M20.2 §5). `expoClient` does NOT use the backend's `bearer()`
 * plugin/token path; it emulates a cookie jar instead — captures each
 * response's `Set-Cookie`, persists it via `expo-secure-store` (real
 * hardware-backed Keychain/Keystore, never AsyncStorage), and replays it as
 * a `Cookie` header on the next request. `getCurrentSession()` on the
 * backend therefore sees an ordinary cookie-authenticated request, exactly
 * like a browser. `authClient.getCookie()` exposes that same stored cookie
 * so `src/lib/api/client.ts` can attach it to `/api/v1/*` calls this SDK
 * doesn't make itself. See lib/auth.ts's `expo()` plugin comment (backend
 * repo) for the server side of this integration.
 *
 * `scheme` matches app.json's `expo.scheme` — required for the native
 * Google OAuth redirect (§12) and left unset here so a scheme drift between
 * the two files fails loudly (`expoClient` throws) instead of silently
 * building the wrong deep link.
 */
export const authClient = createAuthClient({
  baseURL: ENV.ok ? ENV.apiBaseUrl : undefined,
  plugins: [
    expoClient({
      storagePrefix: "crownsourceglobal",
      storage: SecureStore,
    }),
  ],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient;
