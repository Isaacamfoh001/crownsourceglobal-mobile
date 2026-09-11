import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "./useAuth";
import type { ExperienceMode } from "@/types/api";

const STORAGE_KEY = "crownsourceglobal.experience";

/**
 * "Experience Mode" (M32.3) — which focused mobile experience (Buy/Source,
 * Sell, Factory, Beauty) the app currently presents. This is a UI concept
 * layered on top of existing authorization, never a new role: it only
 * decides which nav/labels render. Every `/api/v1/vendor/*` call keeps
 * deriving its own vendor context independently, exactly as before this
 * existed.
 *
 * Persistence — smallest clean way (M32.3 §2/§3): a guest's choice lives
 * only in `AsyncStorage` on-device, so first-run intent can be captured
 * without ever forcing registration. Once signed in, the same value is
 * mirrored to `CustomerProfile.preferredExperience` (`PATCH
 * /api/v1/me/experience`) purely for cross-device/reinstall continuity —
 * the backend value wins once loaded, and is echoed back into
 * `AsyncStorage` so a later sign-out still remembers the last mode.
 */
type ExperienceContextValue = {
  /** False only while the very first local-storage read is in flight. */
  ready: boolean;
  /** Null means the first-run chooser hasn't been completed yet. */
  experience: ExperienceMode | null;
  setExperience: (mode: ExperienceMode) => void;
  /** Legitimate switch targets right now, derived from real `/api/v1/me` data — "BUYER" is always included. */
  availableExperiences: ExperienceMode[];
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { status, me } = useAuth();
  const queryClient = useQueryClient();
  const [storageRead, setStorageRead] = useState(false);
  const [localExperience, setLocalExperience] = useState<ExperienceMode | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setLocalExperience((value as ExperienceMode | null) ?? null))
      .catch(() => {})
      .finally(() => setStorageRead(true));
  }, []);

  const syncMutation = useMutation({
    mutationFn: (preferredExperience: ExperienceMode) =>
      apiClient.patch<null>("/api/v1/me/experience", { body: { preferredExperience } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  const remoteExperience = status === "SIGNED_IN" ? me?.customer?.preferredExperience ?? null : null;

  // The backend value is authoritative once signed in; mirrored locally so
  // a later sign-out still opens into the last mode instead of the chooser.
  useEffect(() => {
    if (remoteExperience) AsyncStorage.setItem(STORAGE_KEY, remoteExperience).catch(() => {});
  }, [remoteExperience]);

  const experience = status === "SIGNED_IN" ? remoteExperience ?? localExperience : localExperience;

  function setExperience(mode: ExperienceMode) {
    setLocalExperience(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
    if (status === "SIGNED_IN") syncMutation.mutate(mode);
  }

  const availableExperiences = useMemo<ExperienceMode[]>(() => {
    const modes = new Set<ExperienceMode>(["BUYER"]);
    if (me?.vendor.available) {
      modes.add("SELLER");
      for (const membership of me.vendor.memberships) {
        // M32.8 — Factory eligibility no longer relies on sellerType alone:
        // an existing Seller who separately applied for and was approved
        // for Manufacturer capability is eligible too (manufacturer.available
        // already covers the direct sellerType === "MANUFACTURER" path as
        // well — see app/api/v1/me/route.ts on the backend — but both are
        // checked here to keep this the one explicit source of truth).
        if (membership.sellerType === "MANUFACTURER" || membership.manufacturer.available) modes.add("FACTORY");
        if (membership.beautyProfessional.available) modes.add("BEAUTY");
      }
    }
    return Array.from(modes);
  }, [me]);

  const value: ExperienceContextValue = { ready: storageRead && status !== "LOADING", experience, setExperience, availableExperiences };

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used within ExperienceProvider");
  return ctx;
}
