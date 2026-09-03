import { Platform } from "react-native";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { ENV } from "@/lib/env";

/**
 * `expoClient`'s `storage` option requires a SYNCHRONOUS `getItem` (see
 * @better-auth/expo's `ExpoClientOptions.storage` type) — it reads the
 * cached cookie inline on every `/api/v1/*` call via `authClient.getCookie()`
 * (src/lib/api/client.ts). `expo-secure-store` has no native module on web
 * (`ExpoSecureStore.web.ts` exports `{}`), so `SecureStore.getItem` there
 * calls into a missing native function and never returns — which hung
 * *every* API call, including public unauthenticated ones, under `expo
 * start --web` (M32.1 finding). `localStorage` is the natural web
 * replacement: it already implements this exact synchronous
 * getItem/setItem shape. Native (iOS/Android) is unaffected — it keeps
 * using real hardware-backed Keychain/Keystore via SecureStore.
 */
const webStorage = {
  getItem: (key: string) => (typeof localStorage === "undefined" ? null : localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  },
};

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
 * Note: even with `webStorage` above, a *signed-in* session still won't
 * persist under `expo start --web` — capturing `Set-Cookie` from a fetch
 * response is a browser-forbidden read regardless of storage backend, so
 * this only ever worked on native. `webStorage` fixes the hang for
 * unauthenticated reads; full auth persistence needs a real device/simulator.
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
      storage: Platform.OS === "web" ? webStorage : SecureStore,
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
