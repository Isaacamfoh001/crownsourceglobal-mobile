import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useVendorOrders } from "@/features/vendor/useVendorOrders";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { VendorFulfilmentSummaryDTO } from "@/types/api";

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "PENDING", label: "New" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "EXCEPTION", label: "Issues" },
] as const;

function OrderRow({ order }: { order: VendorFulfilmentSummaryDTO }) {
  const { colors } = useAppTheme();
  const info = vendorStatus.fulfilment(order.status);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/vendor-orders/[id]", params: { id: order.id } })}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: order.hasOpenIssue ? colors.error : colors.border }]}
    >
      <View style={styles.rowInfo}>
        <Text variant="bodyMedium" tone="primary">
          {order.orderNumber}
        </Text>
        <Text variant="small" tone="secondary">
          {order.itemCount} item{order.itemCount === 1 ? "" : "s"} · qty {order.totalQuantity}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={info.label} tone={info.tone} />
          {order.hasOpenIssue ? <StatusBadge label="Issue" tone="error" /> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export default function VendorOrdersScreen() {
  const params = useLocalSearchParams<{ status?: string }>();
  const { status: authStatus } = useAuth();
  const [filter, setFilter] = useState<string | undefined>(params.status);
  const query = useVendorOrders(filter, authStatus === "SIGNED_IN");
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];
  const { colors } = useAppTheme();

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <Text variant="screenTitle" tone="primary" style={styles.title}>
        Orders
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.label}
            onPress={() => setFilter(f.value)}
            style={[
              styles.filterChip,
              { borderColor: filter === f.value ? colors.pink : colors.border, backgroundColor: filter === f.value ? colors.pinkSurface : colors.surface },
            ]}
          >
            <Text variant="small" tone={filter === f.value ? "pink" : "secondary"}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={84} radius={Radius.lg} />
            <Skeleton height={84} radius={Radius.lg} />
          </View>
        ) : query.isError ? (
          <ErrorState title="Couldn't load orders" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon="cube-outline" title="No orders here" message="Orders needing action will show up here." />
        ) : (
          rows.map((order) => <OrderRow key={order.id} order={order} />)
        )}

        {query.hasNextPage ? (
          <Button label={query.isFetchingNextPage ? "Loading…" : "Load more"} variant="outline" onPress={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  filterRow: { gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  filterChip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  loading: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  rowInfo: { flex: 1, gap: 4 },
  badgeRow: { flexDirection: "row", gap: Spacing.xs, marginTop: 2 },
});
