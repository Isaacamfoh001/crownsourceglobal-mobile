import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorEarningDetail } from "@/features/vendor/useVendorFinance";
import { vendorStatus } from "@/lib/vendorStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";

export default function VendorEarningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorEarningDetail(ready ? id : undefined);

  if (!ready) return null;

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={140} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState title="Couldn't load this earning" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const earning = query.data;
  const info = vendorStatus.earning(earning.status);

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          Order {earning.orderNumber}
        </Text>
      </View>

      <View style={styles.section}>
        <StatusBadge label={info.label} tone={info.tone} />
        <Text variant="screenTitle" tone="primary">
          {formatMoney(earning.amount)}
        </Text>
        {earning.holdReasonSafe ? (
          <Text variant="small" tone="warning">
            {earning.holdReasonSafe}
          </Text>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Row label="Item" value={earning.orderItemDescription} />
        <Row label="Quantity" value={String(earning.quantity)} />
        <Row label="Fulfilment status" value={earning.fulfilmentStatus} />
        {earning.eligibleAt ? <Row label="Eligible" value={new Date(earning.eligibleAt).toLocaleDateString()} /> : null}
      </View>

      {earning.adjustments.length > 0 ? (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary">
            Adjustments
          </Text>
          {earning.adjustments.map((adjustment) => (
            <View key={adjustment.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text variant="body" tone="primary">
                {formatMoney(adjustment.amount)}
              </Text>
              <Text variant="small" tone="secondary">
                {adjustment.reason}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="body" tone="primary">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  section: { padding: Spacing.md, gap: Spacing.xs },
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
