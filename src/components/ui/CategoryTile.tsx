import { Pressable, StyleSheet } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

type CategoryTileProps = {
  label: string;
  onPress: () => void;
  selected?: boolean;
};

/** Compact category pill — used in the horizontal category rail on Home/Shop. Deliberately icon-free text pill (no per-category icon exists in the API) rather than inventing iconography per category. */
export function CategoryTile({ label, onPress, selected = false }: CategoryTileProps) {
  const { colors } = useAppTheme();
  const bg = selected ? colors.pink : colors.surface;
  const borderColor = selected ? colors.pink : colors.border;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tile, { backgroundColor: bg, borderColor }, pressed && styles.pressed]}
    >
      <Text variant="smallMedium" tone={selected ? "onAccent" : "primary"}>
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
});
