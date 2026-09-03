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
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorResolutions } from "@/features/vendor/useVendorResolutions";
import { orderStatus } from "@/lib/orderStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { VendorResolutionCaseSummaryDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function CaseRow({ item }: { item: VendorResolutionCaseSummaryDTO }) {
  const { colors } = useAppTheme();
  const info = orderStatus.resolutionCase(item.status);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/vendor-resolutions/[id]", params: { id: item.id } })}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowInfo}>
        <Text variant="bodyMedium" tone="primary" numberOfLines={1}>
          {item.caseNumber}
        </Text>
        <Text variant="small" tone="secondary">
          Order {item.orderNumber}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={info.label} tone={info.tone} />
          <Text variant="caption" tone="muted">
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

/**
 * Vendor Mode → Resolutions (M29.1) — read-only, mirroring the web Vendor
 * Portal's own deliberately restricted view (M9 §46): no customer identity/
 * contact/description/decision/refund data, only which of the vendor's
 * items are affected and the case status. Reuses the existing
 * resolutionsService.listForVendorPaginated unchanged via a new thin
 * /api/v1/vendor/resolutions route.
 */
export default function VendorResolutionsScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorResolutions(ready);
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];

  if (!ready) return null;

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="screenTitle" tone="primary">
          Resolutions
        </Text>
      </View>

      <View style={styles.list}>
        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={72} radius={Radius.lg} />
            <Skeleton height={72} radius={Radius.lg} />
          </View>
        ) : query.isError ? (
          <ErrorState title="Couldn't load resolutions" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="No open cases" message="Order issues affecting your items will show up here." />
        ) : (
          rows.map((item) => <CaseRow key={item.id} item={item} />)
        )}
        {query.hasNextPage ? (
          <Pressable onPress={() => query.fetchNextPage()} style={styles.loadMore}>
            <Text variant="small" tone="secondary">
              {query.isFetchingNextPage ? "Loading…" : "Load more"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  list: { padding: Spacing.md, gap: Spacing.sm },
  loading: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  rowInfo: { flex: 1, gap: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 2 },
  loadMore: { alignItems: "center", paddingVertical: Spacing.sm },
});
