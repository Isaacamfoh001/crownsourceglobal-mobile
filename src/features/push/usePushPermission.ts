import { useEffect } from "react";
import { AppState } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPermissionState, pushUnavailableReason, requestAndRegister, type PushUnavailableReason } from "@/lib/push/registration";

const PUSH_PERMISSION_QUERY_KEY = ["push-permission"] as const;

/**
 * Drives the Account/Notifications "Turn on notifications" affordance
 * (M31 §8) — never requests OS permission on its own; only `enable()`
 * (an explicit user tap) does that. Backed by react-query (this codebase's
 * one server/external-state layer — see lib/api/query-client.ts) rather
 * than a local `useEffect`+`useState` pair, so a permission the user
 * changed in iOS/Android Settings is refreshed the same way every other
 * query in this app would be: `invalidateQueries` on the AppState
 * "active" transition, not a component-owned state setter.
 */
export function usePushPermission() {
  const unavailable: PushUnavailableReason | null = pushUnavailableReason();
  const queryClient = useQueryClient();

  const permissionQuery = useQuery({
    queryKey: PUSH_PERMISSION_QUERY_KEY,
    queryFn: getPermissionState,
    enabled: !unavailable,
    staleTime: 0,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") queryClient.invalidateQueries({ queryKey: PUSH_PERMISSION_QUERY_KEY });
    });
    return () => subscription.remove();
  }, [queryClient]);

  const enableMutation = useMutation({
    mutationFn: requestAndRegister,
    onSuccess: (result) => {
      queryClient.setQueryData(PUSH_PERMISSION_QUERY_KEY, result.permission);
    },
  });

  return {
    permission: unavailable ? null : (permissionQuery.data ?? null),
    unavailable,
    isRequesting: enableMutation.isPending,
    enable: () => enableMutation.mutate(),
  };
}
