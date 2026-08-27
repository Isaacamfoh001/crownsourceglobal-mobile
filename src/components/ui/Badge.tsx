import { StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { AvailabilityStatus } from "@/types/api";
import { formatAvailability } from "@/lib/format";
import { Text, type TextTone } from "./Text";

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const { colors } = useAppTheme();
  const style: Record<AvailabilityStatus, { bg: string; tone: TextTone }> = {
    IN_STOCK: { bg: colors.successSurface, tone: "success" },
    LOW_STOCK: { bg: colors.warningSurface, tone: "warning" },
    OUT_OF_STOCK: { bg: colors.errorSurface, tone: "error" },
    MADE_TO_ORDER: { bg: colors.goldSurface, tone: "gold" },
  };
  const { bg, tone } = style[status] ?? style.IN_STOCK;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" tone={tone}>
        {formatAvailability(status).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
});
