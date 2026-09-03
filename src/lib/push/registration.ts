import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { apiClient } from "@/lib/api/client";

/**
 * Why registration can't proceed right now, in priority order (M31 §16's
 * audit): a simulator/emulator has no real push token to get; Expo Go
 * cannot receive remote push on the current SDK at all (a development
 * build is required — see docs); and `getExpoPushTokenAsync` requires an
 * EAS `projectId`, which only exists once `eas init`/`eas build:configure`
 * has been run for this project (an external step — never invented here).
 */
export type PushUnavailableReason = "not-device" | "expo-go" | "missing-project-id";

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Cheap, synchronous — checked before ever touching permissions or the network. */
export function pushUnavailableReason(): PushUnavailableReason | null {
  if (!Device.isDevice) return "not-device";
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return "expo-go";
  if (!getProjectId()) return "missing-project-id";
  return null;
}

function currentPlatform(): "IOS" | "ANDROID" {
  return Platform.OS === "ios" ? "IOS" : "ANDROID";
}

async function getExpoPushToken(): Promise<string> {
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: getProjectId() });
  return data;
}

export type PermissionState = "granted" | "denied" | "undetermined";

export async function getPermissionState(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Requests OS permission if not yet asked, then registers this device with
 * the backend (POST /api/v1/me/devices). Never called automatically at
 * launch (M31 §8) — only from an explicit user action (the Account
 * "Turn on notifications" row) or from `syncIfAlreadyGranted` below for a
 * silent refresh. Returns the resulting permission state so the caller can
 * show the right follow-up copy (e.g. "open Settings" once truly denied).
 */
export async function requestAndRegister(): Promise<{ permission: PermissionState; registered: boolean }> {
  const unavailable = pushUnavailableReason();
  if (unavailable) return { permission: "undetermined", registered: false };

  const existing = await Notifications.getPermissionsAsync();
  const { status } = existing.status === "granted" ? existing : await Notifications.requestPermissionsAsync();
  if (status !== "granted") return { permission: status, registered: false };

  const expoPushToken = await getExpoPushToken();
  await apiClient.post("/api/v1/me/devices", { body: { expoPushToken, platform: currentPlatform() } });
  return { permission: "granted", registered: true };
}

/**
 * Silent, no-prompt re-registration — called right after sign-in and on
 * cold start while already signed in (M31 §3/§11). Only acts when
 * permission was already granted in a previous session; never surfaces
 * the OS permission dialog itself, matching "do not nag every launch."
 * A refresh-token/reinstall scenario (a new token replacing an old one)
 * is handled the same way as first registration — upsert-by-token on the
 * backend reassigns/refreshes the row regardless of whether it's new.
 */
export async function syncIfAlreadyGranted(): Promise<void> {
  if (pushUnavailableReason()) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;
  try {
    const expoPushToken = await getExpoPushToken();
    await apiClient.post("/api/v1/me/devices", { body: { expoPushToken, platform: currentPlatform() } });
  } catch {
    // Best-effort — a failed background sync must never block sign-in or app startup.
  }
}

/**
 * Unregisters this device on sign-out (M31 §11's privacy boundary) — must
 * run BEFORE the session/cookie is cleared, since it's an authenticated
 * call. Best-effort: a network failure here must never block sign-out
 * itself (the user still expects to be signed out immediately).
 */
export async function unregisterCurrentDevice(): Promise<void> {
  if (pushUnavailableReason()) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return; // never had a real token to unregister
    const expoPushToken = await getExpoPushToken();
    await apiClient.delete("/api/v1/me/devices", { query: { expoPushToken } });
  } catch {
    // Best-effort — see doc comment above.
  }
}
