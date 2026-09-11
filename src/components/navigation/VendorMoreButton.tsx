import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

/**
 * Header entry into Vendor Mode's "More" hub (M32.4 §2/§10) — bottom
 * navigation is capped at 4 items per experience, so secondary
 * functionality (Store settings, Messages, Resolutions, Switch experience)
 * lives one tap away from the header instead of consuming a 5th tab.
 */
export function VendorMoreButton() {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={() => router.push("/(vendor)/more")} accessibilityRole="button" accessibilityLabel="More" hitSlop={8}>
      <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={colors.textPrimary} />
    </Pressable>
  );
}
