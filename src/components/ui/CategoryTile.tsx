import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Color, IconSize, Radius, Spacing } from "@/constants/theme";
import { Text } from "./Text";

type CategoryTileProps = {
  label: string;
  onPress: () => void;
  selected?: boolean;
  tone?: "onDark" | "onLight";
};

/** Compact category pill — used in the horizontal category rail on Home/Shop. Deliberately icon-free text pill (no per-category icon exists in the API) rather than inventing iconography per category. */
export function CategoryTile({ label, onPress, selected = false, tone = "onLight" }: CategoryTileProps) {
  const onDark = tone === "onDark";
  const bg = selected ? Color.pink : onDark ? "rgba(255,255,255,0.08)" : Color.commerce.surface;
  const borderColor = selected ? Color.pink : onDark ? "rgba(255,255,255,0.14)" : Color.commerce.border;
  const textTone = selected ? "inverse" : onDark ? "onDark" : "onLight";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tile, { backgroundColor: bg, borderColor }, pressed && styles.pressed]}
    >
      <Text variant="smallMedium" tone={textTone as never}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CategoryIconTile({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.iconTile, pressed && styles.pressed]}>
      <View style={styles.iconCircle}>
        <Ionicons name="pricetags-outline" size={IconSize.lg} color={Color.commerce.textPrimary} />
      </View>
      <Text variant="small" tone="onLight" numberOfLines={2} style={styles.iconTileLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pressed: { opacity: 0.85 },
  iconTile: { width: 76, alignItems: "center", gap: Spacing.xxs },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Color.commerce.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTileLabel: { textAlign: "center" },
});
