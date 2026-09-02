import { StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text, type TextTone } from "./Text";

/** Generic status pill (M27) — takes an already-resolved { label, tone } pair, e.g. from lib/vendorStatus.ts, rather than knowing about any specific status enum itself. */
export function StatusBadge({ label, tone }: { label: string; tone: TextTone }) {
  const { colors } = useAppTheme();
  const bg: Record<TextTone, string> = {
    primary: colors.surfaceSubtle,
    secondary: colors.surfaceSubtle,
    muted: colors.surfaceSubtle,
    pink: colors.pinkSurface,
    gold: colors.goldSurface,
    success: colors.successSurface,
    warning: colors.warningSurface,
    error: colors.errorSurface,
    inverse: colors.surfaceSubtle,
    onAccent: colors.pink,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bg[tone] }]}>
      <Text variant="caption" tone={tone}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.xs, paddingVertical: 4, borderRadius: Radius.sm, alignSelf: "flex-start" },
});
