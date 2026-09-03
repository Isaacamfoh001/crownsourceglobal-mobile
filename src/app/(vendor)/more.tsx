import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; description: string; onPress: () => void }[] = [
  {
    icon: "storefront-outline",
    label: "Store settings",
    description: "Store name, description, location, pickup details",
    onPress: () => router.push("/vendor-store"),
  },
  {
    icon: "sparkles-outline",
    label: "Beauty Professional",
    description: "Profile, services, and service requests",
    onPress: () => router.push("/vendor-beauty-professional"),
  },
  {
    icon: "images-outline",
    label: "My Explore posts",
    description: "Your published and pending posts",
    onPress: () => router.push("/vendor-explore-posts"),
  },
  {
    icon: "globe-outline",
    label: "Sourcing requests",
    description: "Requests CrownSourceGlobal has asked you to quote on",
    onPress: () => router.push("/vendor-sourcing-requests"),
  },
  {
    icon: "alert-circle-outline",
    label: "Resolutions",
    description: "Order issues affecting your items",
    onPress: () => router.push("/vendor-resolutions"),
  },
];

/** Vendor Mode's "More" hub (M27 §6) — restrained by design, not every desktop admin surface (M27 §2). */
export default function VendorMoreScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen>
      <Text variant="screenTitle" tone="primary" style={styles.title}>
        More
      </Text>

      <View style={styles.section}>
        <View style={[styles.groupedList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {ITEMS.map((item, index) => (
            <Pressable key={item.label} onPress={item.onPress} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.goldSurface }]}>
                <Ionicons name={item.icon} size={18} color={colors.goldStrong} />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyMedium" tone="primary">
                  {item.label}
                </Text>
                <Text variant="small" tone="secondary">
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Button label="Switch to shopping" variant="outline" onPress={() => router.replace("/(tabs)/account")} fullWidth />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  section: { padding: Spacing.md },
  groupedList: { borderWidth: 1, borderRadius: Radius.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
});
