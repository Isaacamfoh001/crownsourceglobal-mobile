import { useQueryClient } from "@tanstack/react-query";
import { useSession, signOut as authSignOut } from "@/lib/auth/client";
import { useMe } from "@/features/auth/useMe";

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

  async function signOut() {
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
