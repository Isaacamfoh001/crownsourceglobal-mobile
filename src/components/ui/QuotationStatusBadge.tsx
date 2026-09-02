import { StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";
import type { QuotationEffectiveStatus } from "@/types/api";

type Tone = "gold" | "success" | "error" | "muted";

function describe(status: QuotationEffectiveStatus): { label: string; tone: Tone } {
  switch (status) {
    case "ISSUED":
      return { label: "Ready to review", tone: "gold" };
    case "ACCEPTED":
      return { label: "Accepted", tone: "success" };
    case "EXPIRED":
      return { label: "Expired", tone: "muted" };
  }
}

export function QuotationStatusBadge({ status }: { status: QuotationEffectiveStatus }) {
  const { colors } = useAppTheme();
  const { label, tone } = describe(status);
  const bg = tone === "gold" ? colors.goldSurface : tone === "success" ? colors.successSurface : tone === "error" ? colors.errorSurface : colors.surfaceSubtle;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" tone={tone}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.xs, paddingVertical: 4, borderRadius: Radius.sm, alignSelf: "flex-start" },
});
