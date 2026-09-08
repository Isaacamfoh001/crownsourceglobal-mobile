import { useEffect } from "react";
import { usePathname, router } from "expo-router";
import { useExperience } from "@/hooks/useExperience";

/**
 * Shows the first-run experience chooser exactly once (M32.3 §2) — a
 * side-effect-only component, same convention as `PushSessionBridge`.
 * Redirects to `/welcome` once local storage has been read and no
 * experience has ever been chosen yet; never re-fires after that, and
 * never blocks rendering (`(tabs)` still mounts underneath while ready).
 */
export function ExperienceGate() {
  const { ready, experience } = useExperience();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && experience === null && pathname !== "/welcome") {
      router.replace("/welcome");
    }
  }, [ready, experience, pathname]);

  return null;
}
