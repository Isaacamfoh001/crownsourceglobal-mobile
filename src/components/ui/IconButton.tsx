import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { Color, IconSize, TouchTarget } from "@/constants/theme";

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: "onDark" | "onLight";
  size?: number;
  badge?: boolean;
  accessibilityLabel: string;
};

/** Circular icon-only touch target (header actions, search field icons) — always meets the 44pt minimum regardless of the visual icon size. */
export function IconButton({ name, onPress, tone = "onLight", size = IconSize.lg, badge = false, accessibilityLabel }: IconButtonProps) {
  const iconColor = tone === "onDark" ? Color.brand.textPrimary : Color.commerce.textPrimary;
  const bg = tone === "onDark" ? "rgba(255,255,255,0.08)" : Color.commerce.surfaceSubtle;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [styles.base, { backgroundColor: bg }, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={size} color={iconColor} />
      {badge && <Pressable pointerEvents="none" style={styles.badge} />}
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
    backgroundColor: Color.pink,
  },
});
