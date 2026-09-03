import { useQueryClient } from "@tanstack/react-query";
import { useSession, signOut as authSignOut } from "@/lib/auth/client";
import { useMe } from "@/features/auth/useMe";
import { unregisterCurrentDevice } from "@/lib/push/registration";

export type AuthStatus = "LOADING" | "SIGNED_OUT" | "SIGNED_IN";

/**
 * The one place every screen reads sign-in state (M20.2 §7) — composes
 * Better Auth's own reactive `useSession()` (backed by a global store, so
 * every caller of this hook stays in sync without a Context provider) with
 * `/api/v1/me` for the real name/customer/vendor data Better Auth's session
 * doesn't carry. No custom auth state machine: `status` is derived, not
 * separately tracked.
 */
export function useAuth() {
  const { data: session, isPending } = useSession();
  const isSignedIn = Boolean(session?.user);
  const meQuery = useMe(isSignedIn);
  const queryClient = useQueryClient();

  const status: AuthStatus = isPending ? "LOADING" : isSignedIn ? "SIGNED_IN" : "SIGNED_OUT";

  /**
   * Unregisters this device's push token BEFORE clearing the session
   * (M31 §11/§13 — a previous account's private pushes must never keep
   * reaching a device after sign-out, including the "same device, next
   * account" case). Must run first: it's an authenticated call that needs
   * the session cookie `authSignOut()` is about to clear. Best-effort —
   * `unregisterCurrentDevice` swallows its own failures — so a flaky
   * network never blocks sign-out itself.
   */
  async function signOut() {
    await unregisterCurrentDevice();
    await authSignOut();
    queryClient.removeQueries({ queryKey: ["me"] });
  }

  return {
    status,
    user: session?.user ?? null,
    me: meQuery.data ?? null,
    isMeLoading: isSignedIn && meQuery.isPending,
    meError: meQuery.isError ? meQuery.error : null,
    refetchMe: meQuery.refetch,
    signOut,
  };
}
