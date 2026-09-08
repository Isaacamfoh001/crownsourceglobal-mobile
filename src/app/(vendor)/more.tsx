import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useExperience } from "@/hooks/useExperience";

type MoreItem = { icon: keyof typeof Ionicons.glyphMap; label: string; description: string; onPress: () => void };

/**
 * Vendor Mode's "More" hub (M27 §6, simplified M32.3 §6/§17) — restrained
 * by design, not every desktop admin surface. Beauty Professional and
 * Sourcing Requests are deliberately NOT here: they're each their own
 * primary tab in the experience that actually uses them (BEAUTY, FACTORY)
 * and reachable for everyone else via Account → Switch experience, never
 * shown to a plain Seller "merely because the user is a vendor" (M32.3
 * §6). "My Explore posts" is hidden in BEAUTY mode specifically because
 * that mode already has its own dedicated Explore tab.
 */
export default function VendorMoreScreen() {
  const { colors } = useAppTheme();
  const { experience } = useExperience();

  const items: MoreItem[] = [
    {
      icon: "storefront-outline",
      label: "Store settings",
      description: "Store name, description, location, pickup details",
      onPress: () => router.push("/vendor-store"),
    },
    // Factory's primary tabs prioritize Sourcing Requests (M32.3 §7) —
    // product-listing management stays available here rather than
    // competing with that workflow as a second primary tab. Seller mode
    // already has Products as a primary tab, so it's omitted here to
    // avoid a duplicate entry; Beauty mode deliberately never shows
    // catalogue listing management (§8).
    ...(experience === "FACTORY"
      ? [
          {
            icon: "pricetags-outline" as const,
            label: "Products",
            description: "Any listings your factory also sells directly",
            onPress: () => router.push("/(vendor)/listings"),
          },
        ]
      : []),
    ...(experience === "BEAUTY"
      ? []
      : [
          {
            icon: "images-outline" as const,
            label: "My Explore posts",
            description: "Your published and pending posts",
            onPress: () => router.push("/vendor-explore-posts"),
          },
        ]),
    {
      icon: "alert-circle-outline",
      label: "Resolutions",
      description: "Order issues affecting your items",
      onPress: () => router.push("/vendor-resolutions"),
    },
    {
      icon: "chatbubble-ellipses-outline",
      label: "Messages",
      description: "Conversations with CrownSourceGlobal",
      onPress: () => router.push("/vendor-messages"),
    },
  ];

  return (
    <Screen>
      <Text variant="screenTitle" tone="primary" style={styles.title}>
        More
      </Text>

      <View style={styles.section}>
        <View style={[styles.groupedList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {items.map((item, index) => (
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
        <Button label="Switch experience" variant="outline" onPress={() => router.push("/switch-experience")} fullWidth />
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
