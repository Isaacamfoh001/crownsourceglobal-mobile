import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { IconSize, TouchTarget, type ThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

type NotificationBellProps = {
  onPress?: () => void;
  /**
   * Overrides the resolved app theme's colors. Home's brand header is a
   * permanently-dark surface regardless of light/dark mode (see AppLogo.tsx
   * and Home's hero), so it passes Palette.dark explicitly rather than
   * letting this read useAppTheme() and mismatch the surface it sits on.
   */
  colors?: ThemeColors;
  /**
   * Unread count from a future notifications API. There is no notifications
   * backend/mobile integration yet (M19.2.1 scope), so every call site
   * omits this today — never pass a fabricated number. Undefined/0 renders
   * a plain bell with no badge.
   */
  unreadCount?: number;
};

/**
 * Reusable notification affordance. Renders as a static (non-pressable)
 * icon until a real onPress destination exists — a Pressable that goes
 * nowhere is worse than an honest placeholder. Once the notifications
 * feature and `unreadCount` data source land, pass `onPress` to make it
 * interactive; the badge will start rendering itself from real data.
 */
export function NotificationBell({ onPress, colors: colorsOverride, unreadCount }: NotificationBellProps) {
  const { colors: themeColors } = useAppTheme();
  const colors = colorsOverride ?? themeColors;
  const hasBadge = typeof unreadCount === "number" && unreadCount > 0;
  const label = hasBadge ? `Notifications, ${unreadCount} unread` : "Notifications";

  const content = (
    <View style={[styles.base, { backgroundColor: colors.surfaceSubtle }]}>
      <Ionicons name="notifications-outline" size={IconSize.lg} color={colors.textPrimary} />
      {hasBadge && (
        <View style={[styles.badge, { backgroundColor: colors.pink, borderColor: colors.bg }]}>
          <Text variant="caption" tone="onAccent" style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
      {content}
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
