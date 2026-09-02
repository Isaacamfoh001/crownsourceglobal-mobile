import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useVendorListings } from "@/features/vendor/useVendorListings";
import { vendorStatus } from "@/lib/vendorStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { VendorListingSummaryDTO } from "@/types/api";

function ListingRow({ listing }: { listing: VendorListingSummaryDTO }) {
  const { colors } = useAppTheme();
  const approval = vendorStatus.listingApproval(listing.approvalStatus);
  const lifecycle = vendorStatus.listing(listing.listingStatus);

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
          <StatusBadge label={approval.label} tone={approval.tone} />
          <StatusBadge label={lifecycle.label} tone={lifecycle.tone} />
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

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <View style={styles.header}>
        <Text variant="screenTitle" tone="primary">
          Listings
        </Text>
        <Button label="New" icon={<Ionicons name="add" size={16} color={colors.textOnAccent} />} onPress={() => router.push("/vendor-listings/new")} />
      </View>

      <View style={styles.list}>
        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={84} radius={Radius.lg} />
            <Skeleton height={84} radius={Radius.lg} />
            <Skeleton height={84} radius={Radius.lg} />
          </View>
        ) : query.isError ? (
          <ErrorState title="Couldn't load your listings" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="pricetags-outline"
            title="No listings yet"
            message="Create your first listing to start selling on CrownSourceGlobal."
            actionLabel="Create a listing"
            onAction={() => router.push("/vendor-listings/new")}
          />
        ) : (
          rows.map((listing) => <ListingRow key={listing.id} listing={listing} />)
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
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  loading: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  rowInfo: { flex: 1, gap: 4 },
  badgeRow: { flexDirection: "row", gap: Spacing.xs, marginTop: 2 },
});
