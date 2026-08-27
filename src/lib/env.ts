/**
 * Non-secret environment resolution. EXPO_PUBLIC_* variables are baked into
 * the JS bundle at build time and are readable by anyone with the app —
 * never put a secret here (see .env.example).
 *
 * Deliberately does not fall back to a production URL when unset: a
 * developer who forgets to configure this should see a clear message, not
 * accidentally browse/mutate production data from a dev build.
 */

export type EnvCheck = { ok: true; apiBaseUrl: string } | { ok: false; message: string };

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveApiBaseUrl(): EnvCheck {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!raw || raw.trim().length === 0) {
    return {
      ok: false,
      message:
        "EXPO_PUBLIC_API_BASE_URL is not set.\n\n" +
        "Create a .env.local file in the project root (copy .env.example) and point it at your local CrownSourceGlobal backend:\n\n" +
        "• iOS Simulator: http://localhost:3000\n" +
        "• Android Emulator: http://10.0.2.2:3000\n" +
        "• Physical phone on the same Wi-Fi: http://<your-Mac's-LAN-IP>:3000\n\n" +
        "Then restart `npx expo start`.",
    };
  }

  return { ok: true, apiBaseUrl: stripTrailingSlash(raw.trim()) };
}

export const ENV = resolveApiBaseUrl();
