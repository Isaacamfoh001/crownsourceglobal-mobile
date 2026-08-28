import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

const BUBBLE_SIZE = 48;

type CategoryIconTileProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  selected?: boolean;
};

/**
 * Shop's visual category rail primitive (M22.3 §5) — a vertical icon+label
 * tile, distinct from CategoryTile's horizontal text pill (still used
 * as-is by Beauty Services / Request Service / Explore create, which this
 * milestone does not touch). Matches the client reference's Marketplace
 * category rail composition (icon bubble over a compact label) rather than
 * a row of text pills.
 */
export function CategoryIconTile({ label, icon, onPress, selected = false }: CategoryIconTileProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: selected ? colors.pink : colors.surface,
            borderColor: selected ? colors.pink : colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={selected ? colors.textOnAccent : colors.textSecondary} />
      </View>
      <Text variant="small" tone={selected ? "pink" : "secondary"} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", width: 68, gap: 6 },
  pressed: { opacity: 0.8 },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { textAlign: "center" },
});
