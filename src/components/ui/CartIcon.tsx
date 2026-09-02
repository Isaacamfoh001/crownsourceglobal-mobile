import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { IconSize, TouchTarget, type ThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

type CartIconProps = {
  onPress: () => void;
  itemCount?: number;
  /** Same override pattern as NotificationBell — for a fixed-dark surface (e.g. a hero header) regardless of the resolved app theme. */
  colors?: ThemeColors;
};

/** Real cart-count badge (M25) — `itemCount` always comes from the actual cart (useCart), never fabricated. Undefined/0 renders a plain bag with no badge, same convention as NotificationBell. */
export function CartIcon({ onPress, itemCount, colors: colorsOverride }: CartIconProps) {
  const { colors: themeColors } = useAppTheme();
  const colors = colorsOverride ?? themeColors;
  const hasBadge = typeof itemCount === "number" && itemCount > 0;
  const label = hasBadge ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart";

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={({ pressed }) => [styles.base, { backgroundColor: colors.surfaceSubtle }, pressed && styles.pressed]}>
      <Ionicons name="bag-handle-outline" size={IconSize.lg} color={colors.textPrimary} />
      {hasBadge && (
        <View style={[styles.badge, { backgroundColor: colors.pink, borderColor: colors.bg }]}>
          <Text variant="caption" tone="onAccent" style={styles.badgeText}>
            {itemCount > 9 ? "9+" : itemCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: TouchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, lineHeight: 11, fontWeight: "700" },
});
