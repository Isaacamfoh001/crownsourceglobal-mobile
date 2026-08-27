import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { Palette, Shadow, type ColorScheme, type ThemeColors, type ThemeShadow } from "@/constants/theme";

export type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  /** The user's stored preference — "system" follows the OS appearance. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** The actual scheme currently in effect once "system" is resolved. */
  scheme: ColorScheme;
  colors: ThemeColors;
  shadow: ThemeShadow;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * App-wide light/dark theme. `mode` is the user's stored preference
 * (System/Light/Dark, selectable from Account — see AppearanceSetting);
 * `scheme` is what that preference resolves to right now. Every screen
 * reads colors through `useAppTheme()` instead of importing a fixed
 * palette, so the same component renders correctly under either theme.
 *
 * M19.2 scope note: the preference lives in memory only (resets to
 * "system" on app restart) — there's no device-storage dependency in this
 * repo yet. The milestone that explicitly asked for this system says local
 * persistence is "sufficient later," so this is a deliberate deferral, not
 * an oversight — see the M19.2 report.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  const scheme: ColorScheme = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, scheme, colors: Palette[scheme], shadow: Shadow[scheme] }),
    [mode, scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within AppThemeProvider");
  return ctx;
}
