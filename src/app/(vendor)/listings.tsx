import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { VendorMoreButton } from "@/components/navigation/VendorMoreButton";
import { useVendorListings } from "@/features/vendor/useVendorListings";
import { vendorStatus, type ListingPresentationGroup } from "@/lib/vendorStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { VendorListingSummaryDTO } from "@/types/api";

const FILTERS: { value: ListingPresentationGroup; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "inReview", label: "In review" },
  { value: "draft", label: "Draft" },
];

/**
 * M32.4 §11/§14 — a single plain-language status badge (via
 * `vendorStatus.listingGroup`) plus an in-review edit awaiting
 * re-approval. Never shows the raw `approvalStatus`/`listingStatus` enum
 * pair directly, and deliberately drops any stock-level badge — the
 * vendor knows their own stock; inventory quantity/enforcement still
 * lives server-side and at checkout, just not as seller-facing UI here.
 */
function ListingRow({ listing }: { listing: VendorListingSummaryDTO }) {
  const { colors } = useAppTheme();
  const group = vendorStatus.listingGroup(listing.approvalStatus, listing.listingStatus);
  const info = vendorStatus.listingGroupInfo(group);
  const isHidden = group === "live" && listing.listingStatus === "INACTIVE";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/vendor-listings/[id]", params: { id: listing.id } })}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowInfo}>
        <Text variant="bodyMedium" tone="primary" numberOfLines={1}>
          {listing.title || "Untitled listing"}
        </Text>
        <Text variant="small" tone="secondary">
          {formatMoney(listing.price)} · Qty {listing.availableQuantity}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={info.label} tone={info.tone} />
          {isHidden ? <StatusBadge label="Hidden" tone="muted" /> : null}
          {listing.hasPendingChanges ? <StatusBadge label="Pending changes" tone="gold" /> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export default function VendorListingsScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const query = useVendorListings(status === "SIGNED_IN");
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];
  const [filter, setFilter] = useState<ListingPresentationGroup>("all");

  const filteredRows = filter === "all" ? rows : rows.filter((row) => vendorStatus.listingGroup(row.approvalStatus, row.listingStatus) === filter);

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <View style={styles.header}>
        <Text variant="screenTitle" tone="primary">
          Products
        </Text>
        <View style={styles.headerActions}>
          <Button label="New" icon={<Ionicons name="add" size={16} color={colors.textOnAccent} />} onPress={() => router.push("/vendor-listings/new")} />
          <VendorMoreButton />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[styles.chip, { borderColor: active ? colors.pink : colors.border, backgroundColor: active ? colors.pinkSurface : colors.surface }]}
            >
              <Text variant="small" tone={active ? "pink" : "secondary"}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={84} radius={Radius.lg} />
            <Skeleton height={84} radius={Radius.lg} />
            <Skeleton height={84} radius={Radius.lg} />
          </View>
        ) : query.isError ? (
          <ErrorState title="Couldn't load your listings" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon="pricetags-outline"
            title={rows.length === 0 ? "No listings yet" : "Nothing here"}
            message={rows.length === 0 ? "Create your first listing to start selling on CrownSourceGlobal." : "No products match this filter yet."}
            actionLabel={rows.length === 0 ? "Create a listing" : undefined}
            onAction={rows.length === 0 ? () => router.push("/vendor-listings/new") : undefined}
          />
        ) : (
          filteredRows.map((listing) => <ListingRow key={listing.id} listing={listing} />)
        )}

        {query.hasNextPage ? (
          <Button label={query.isFetchingNextPage ? "Loading…" : "Load more"} variant="outline" onPress={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.md },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  filterRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs, paddingBottom: Spacing.sm },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  loading: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  rowInfo: { flex: 1, gap: 4 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginTop: 2 },
});
