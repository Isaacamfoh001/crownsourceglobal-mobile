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
import { useVendorSettlementDetail } from "@/features/vendor/useVendorFinance";
import { vendorStatus } from "@/lib/vendorStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";

/** Masked destination summary only — never a full account number/phone (M27 §21). */
function destinationSummary(destination: NonNullable<ReturnType<typeof useVendorSettlementDetail>["data"]>["destination"]): string | null {
  if (!destination) return null;
  if (destination.type === "MOBILE_MONEY") return `Mobile Money · ${destination.momoNetwork ?? ""}`;
  return `Bank transfer · ${destination.bankName ?? ""}`;
}

export default function VendorSettlementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorSettlementDetail(ready ? id : undefined);

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
        <ErrorState title="Couldn't load this settlement" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const settlement = query.data;
  const info = vendorStatus.settlement(settlement.status);

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          {settlement.settlementNumber}
        </Text>
      </View>

      <View style={styles.section}>
        <StatusBadge label={info.label} tone={info.tone} />
        <Text variant="screenTitle" tone="primary">
          {formatMoney(settlement.amount)}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Row label="Gross payable" value={formatMoney(settlement.grossPayable)} />
        <Row label="Adjustments" value={formatMoney(settlement.adjustmentTotal)} />
        {settlement.payoutMethod ? <Row label="Payout method" value={settlement.payoutMethod} /> : null}
        {destinationSummary(settlement.destination) ? <Row label="Destination" value={destinationSummary(settlement.destination) ?? ""} /> : null}
        {settlement.payoutPaidAt ? <Row label="Paid" value={new Date(settlement.payoutPaidAt).toLocaleDateString()} /> : null}
        {settlement.payoutNote ? <Row label="Note" value={settlement.payoutNote} /> : null}
      </View>

      {settlement.items.length > 0 ? (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary">
            Included orders
          </Text>
          {settlement.items.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text variant="body" tone="primary">
                {item.orderNumber}
              </Text>
              <Text variant="small" tone="secondary">
                {formatMoney(item.amount)}
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
