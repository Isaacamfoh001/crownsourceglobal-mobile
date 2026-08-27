import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { IconSize, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  badge?: boolean;
  accessibilityLabel: string;
};

/** Circular icon-only touch target (header actions, search field icons) — always meets the 44pt minimum regardless of the visual icon size. */
export function IconButton({ name, onPress, size = IconSize.lg, badge = false, accessibilityLabel }: IconButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [styles.base, { backgroundColor: colors.surfaceSubtle }, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={size} color={colors.textPrimary} />
      {badge && <Pressable pointerEvents="none" style={[styles.badge, { backgroundColor: colors.pink }]} />}
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
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
