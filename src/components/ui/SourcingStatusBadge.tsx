import { StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";
import type { SourcingRequestStatus } from "@/types/api";

type Tone = "gold" | "success" | "error" | "muted";

const TONE: Record<SourcingRequestStatus, Tone> = {
  SUBMITTED: "muted",
  UNDER_REVIEW: "gold",
  SOURCING: "gold",
  AWAITING_CUSTOMER: "gold",
  QUOTED: "gold",
  ACCEPTED: "success",
  UNABLE_TO_SOURCE: "muted",
  CANCELLED: "muted",
};

/** `label` is always the already-humanized statusLabel from the backend (modules/sourcing/service.ts's STATUS_LABELS) — never a raw enum value. */
export function SourcingStatusBadge({ status, label }: { status: SourcingRequestStatus; label: string }) {
  const { colors } = useAppTheme();
  const tone = TONE[status] ?? "muted";
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
