import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useVendorFinanceOverview, useVendorEarnings, useVendorSettlements } from "@/features/vendor/useVendorFinance";
import { vendorStatus } from "@/lib/vendorStatus";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";

function OverviewTile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.tile, { backgroundColor: emphasis ? colors.textPrimary : colors.surface, borderColor: colors.border }]}>
      <Text variant="caption" tone={emphasis ? "inverse" : "muted"}>
        {label}
      </Text>
      <Text variant="sectionHeading" tone={emphasis ? "inverse" : "primary"}>
        {value}
      </Text>
    </View>
  );
}

export default function VendorFinanceScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const [tab, setTab] = useState<"earnings" | "settlements">("earnings");

  const overviewQuery = useVendorFinanceOverview(status === "SIGNED_IN");
  const earningsQuery = useVendorEarnings(undefined, status === "SIGNED_IN" && tab === "earnings");
  const settlementsQuery = useVendorSettlements(undefined, status === "SIGNED_IN" && tab === "settlements");

  const earnings = earningsQuery.data?.pages.flatMap((p) => p.rows) ?? [];
  const settlements = settlementsQuery.data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="screenTitle" tone="primary">
          Finance
        </Text>
        <Pressable onPress={() => router.push("/vendor-finance/payout-destination")} accessibilityRole="button" accessibilityLabel="Payout destination">
          <Ionicons name="card-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {overviewQuery.isPending ? (
        <View style={styles.overviewLoading}>
          <Skeleton height={80} radius={Radius.lg} />
        </View>
      ) : overviewQuery.isError || !overviewQuery.data ? (
        <ErrorState title="Couldn't load finance overview" message={friendlyErrorMessage(overviewQuery.error)} onRetry={() => overviewQuery.refetch()} />
      ) : (
        <View style={styles.overviewGrid}>
          <OverviewTile label="Available for payout" value={formatMoney(overviewQuery.data.availableForSettlement)} emphasis />
          <OverviewTile label="Pending" value={formatMoney(overviewQuery.data.pending)} />
          <OverviewTile label="Waiting period" value={formatMoney(overviewQuery.data.waitingPeriod)} />
          <OverviewTile label="On hold" value={formatMoney(overviewQuery.data.onHold)} />
          <OverviewTile label="Paid to date" value={formatMoney(overviewQuery.data.paidToDate)} />
        </View>
      )}

      <View style={styles.tabRow}>
        {(["earnings", "settlements"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabChip, { borderColor: tab === t ? colors.pink : colors.border, backgroundColor: tab === t ? colors.pinkSurface : "transparent" }]}>
            <Text variant="bodyMedium" tone={tab === t ? "pink" : "secondary"}>
              {t === "earnings" ? "Earnings" : "Settlements"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {tab === "earnings" ? (
          earningsQuery.isPending ? (
            <Skeleton height={64} radius={Radius.lg} />
          ) : earningsQuery.isError ? (
            <ErrorState title="Couldn't load earnings" message={friendlyErrorMessage(earningsQuery.error)} onRetry={() => earningsQuery.refetch()} />
          ) : earnings.length === 0 ? (
            <EmptyState icon="wallet-outline" title="No earnings yet" />
          ) : (
            earnings.map((earning) => {
              const info = vendorStatus.earning(earning.status);
              return (
                <Pressable
                  key={earning.id}
                  onPress={() => router.push({ pathname: "/vendor-finance/earnings/[id]", params: { id: earning.id } })}
                  style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.flex}>
                    <Text variant="bodyMedium" tone="primary">
                      Order {earning.orderNumber}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {formatRelativeTime(earning.createdAt)} ago
                    </Text>
                  </View>
                  <View style={styles.rowEnd}>
                    <Text variant="bodyMedium" tone="primary">
                      {formatMoney(earning.amount)}
                    </Text>
                    <StatusBadge label={info.label} tone={info.tone} />
                  </View>
                </Pressable>
              );
            })
          )
        ) : settlementsQuery.isPending ? (
          <Skeleton height={64} radius={Radius.lg} />
        ) : settlementsQuery.isError ? (
          <ErrorState title="Couldn't load settlements" message={friendlyErrorMessage(settlementsQuery.error)} onRetry={() => settlementsQuery.refetch()} />
        ) : settlements.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No settlements yet" />
        ) : (
          settlements.map((settlement) => {
            const info = vendorStatus.settlement(settlement.status);
            return (
              <Pressable
                key={settlement.id}
                onPress={() => router.push({ pathname: "/vendor-finance/settlements/[id]", params: { id: settlement.id } })}
                style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.flex}>
                  <Text variant="bodyMedium" tone="primary">
                    {settlement.settlementNumber}
                  </Text>
                </View>
                <View style={styles.rowEnd}>
                  <Text variant="bodyMedium" tone="primary">
                    {formatMoney(settlement.amount)}
                  </Text>
                  <StatusBadge label={info.label} tone={info.tone} />
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.md },
  overviewLoading: { paddingHorizontal: Spacing.md },
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, paddingHorizontal: Spacing.md },
  tile: { width: "31%", borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.sm, gap: 4 },
  tabRow: { flexDirection: "row", gap: Spacing.xs, padding: Spacing.md },
  tabChip: { flex: 1, alignItems: "center", borderWidth: 1, borderRadius: Radius.pill, paddingVertical: Spacing.sm },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  flex: { flex: 1 },
  rowEnd: { alignItems: "flex-end", gap: 4 },
});
