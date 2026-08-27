import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, useFonts } from "@expo-google-fonts/playfair-display";
import { queryClient } from "@/lib/api/query-client";
import { ENV } from "@/lib/env";
import { Color, Spacing } from "@/constants/theme";
import { Text } from "@/components/ui/Text";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Font loading must never block startup (MOBILE_V1_PLAN.md §25.2/§38) — a 2.5s ceiling lets the UI proceed on the system font if the Playfair Display fetch is slow, instead of hanging on the splash screen indefinitely. */
const FONT_LOAD_TIMEOUT_MS = 2500;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || Boolean(fontError) || timedOut;

  const onLayoutRootView = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  if (!ENV.ok) {
    return (
      <View style={styles.configScreen} onLayout={onLayoutRootView}>
        <Text variant="h1" tone="onDark" style={styles.center}>
          Configuration required
        </Text>
        <Text variant="body" tone="onDarkMuted" style={[styles.center, styles.configMessage]}>
          {ENV.message}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="vendor/[slug]" options={{ animation: "slide_from_right" }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  configScreen: {
    flex: 1,
    backgroundColor: Color.brand.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  center: { textAlign: "center" },
  configMessage: { lineHeight: 22 },
});
