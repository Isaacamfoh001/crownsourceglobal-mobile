import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, useFonts } from "@expo-google-fonts/playfair-display";
import { queryClient } from "@/lib/api/query-client";
import { ENV } from "@/lib/env";
import { Palette, Spacing, Type } from "@/constants/theme";
import { AppThemeProvider, useAppTheme } from "@/hooks/useAppTheme";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sets the status bar's light/dark content based on OUR resolved theme, not just OS appearance — matters because a user can explicitly pick Dark while the OS is in Light (or vice versa), and the status bar needs to follow the theme they actually see, not the system default. */
function ThemedStatusBar() {
  const { scheme } = useAppTheme();
  return <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
}

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
    // Pre-provider fatal state — deliberately styled with the static dark
    // palette (not useAppTheme()) rather than nesting a whole provider
    // tree just for this rare bootstrap screen.
    return (
      <View style={styles.configScreen} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        <RNText style={[Type.screenTitle, styles.center, { color: Palette.dark.textPrimary }]}>Configuration required</RNText>
        <RNText style={[Type.body, styles.center, styles.configMessage, { color: Palette.dark.textSecondary }]}>{ENV.message}</RNText>
      </View>
    );
  }

  return (
    <AppThemeProvider>
      <ThemedStatusBar />
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="listing/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor/[slug]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="explore/create" options={{ presentation: "modal" }} />
            <Stack.Screen name="explore/saved" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="beauty-services/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="beauty-services/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="beauty-services/request" options={{ presentation: "modal" }} />
            <Stack.Screen name="beauty-services/my-requests" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="sourcing/my-requests" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="sourcing/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="quotations/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="quotations/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="cart/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="checkout/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="checkout/[orderId]/payment" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="checkout/[orderId]/confirmation" options={{ animation: "slide_from_right", gestureEnabled: false }} />
            <Stack.Screen name="orders/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="orders/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="notifications/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="resolutions/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="resolutions/new" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-onboarding/index" options={{ presentation: "modal" }} />
            <Stack.Screen name="(vendor)" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-listings/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-listings/new" options={{ presentation: "modal" }} />
            <Stack.Screen name="vendor-orders/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-finance/earnings/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-finance/settlements/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-finance/payout-destination" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-store" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-beauty-professional/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-beauty-professional/requests/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-explore-posts" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-sourcing-requests/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-sourcing-requests/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-resolutions/index" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="vendor-resolutions/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  configScreen: {
    flex: 1,
    backgroundColor: Palette.dark.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  center: { textAlign: "center" },
  configMessage: { lineHeight: 22 },
});
