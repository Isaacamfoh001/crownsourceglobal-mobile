import { StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";
import type { ServiceRequestStatus } from "@/types/api";

function describe(status: ServiceRequestStatus): { label: string; tone: "gold" | "success" | "error" | "muted" } {
  switch (status) {
    case "SUBMITTED":
      return { label: "Awaiting response", tone: "gold" };
    case "PROVIDER_ACCEPTED":
      return { label: "Accepted", tone: "success" };
    case "PROVIDER_DECLINED":
      return { label: "Declined", tone: "error" };
    case "CANCELLED":
      return { label: "Cancelled", tone: "muted" };
  }
}

export function ServiceRequestStatusBadge({ status }: { status: ServiceRequestStatus }) {
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
