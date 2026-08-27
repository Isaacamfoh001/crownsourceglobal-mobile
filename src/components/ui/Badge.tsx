import { StyleSheet, View } from "react-native";
import { Color, Radius, Spacing } from "@/constants/theme";
import type { AvailabilityStatus } from "@/types/api";
import { formatAvailability } from "@/lib/format";
import { Text } from "./Text";

const STATUS_STYLE: Record<AvailabilityStatus, { bg: string; tone: "success" | "warning" | "error" | "goldOnLight" }> = {
  IN_STOCK: { bg: Color.successSurface, tone: "success" },
  LOW_STOCK: { bg: Color.warningSurface, tone: "warning" },
  OUT_OF_STOCK: { bg: Color.errorSurface, tone: "error" },
  MADE_TO_ORDER: { bg: "#F4EEE0", tone: "goldOnLight" },
};

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.IN_STOCK;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text variant="caption" tone={style.tone}>
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
