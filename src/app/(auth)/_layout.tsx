import { Stack } from "expo-router";

/**
 * Authentication route group (M20.2 §13) — kept separate from the bottom
 * tabs. Each screen renders its own header/back affordance (see
 * AuthScreenHeader) rather than expo-router's default native header, matching
 * this app's existing headerShown:false convention (see src/app/_layout.tsx).
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
