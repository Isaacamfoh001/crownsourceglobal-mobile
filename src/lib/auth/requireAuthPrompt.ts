import { Alert } from "react-native";
import { router } from "expo-router";

/**
 * Polished, minimal sign-in requirement flow (M21 §31): action → "Sign In /
 * Create Account" → later return path, without destroying the visitor's
 * browsing context (no navigation happens until they choose to sign in).
 * `redirectTo` is passed through to the sign-in screen's existing
 * `?redirect=` param (src/app/(auth)/sign-in.tsx) so they land back where
 * they were after authenticating.
 */
export function promptSignInRequired(action: string, redirectTo: string) {
  Alert.alert("Sign in required", `Sign in to ${action}.`, [
    { text: "Not now", style: "cancel" },
    {
      text: "Sign In",
      onPress: () => router.push({ pathname: "/(auth)/sign-in", params: { redirect: redirectTo } }),
    },
  ]);
}
