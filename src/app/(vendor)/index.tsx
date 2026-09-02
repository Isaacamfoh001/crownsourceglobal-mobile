import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useVendorDashboard } from "@/features/vendor/useVendorDashboard";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";

function StatTile({ icon, label, value, warn }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; warn?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: warn ? colors.warningSurface : colors.goldSurface }]}>
        <Ionicons name={icon} size={16} color={warn ? colors.warning : colors.goldStrong} />
      </View>
      <Text variant="sectionHeading" tone="primary">
        {value}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function VendorDashboardScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const query = useVendorDashboard(status === "SIGNED_IN");

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={100} radius={Radius.lg} />
          <Skeleton height={90} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState title="Couldn't load your dashboard" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const data = query.data;
  const isLive = data.vendor.verificationStatus === "APPROVED";

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <View style={styles.container}>
        <View style={[styles.welcomeBand, { backgroundColor: colors.goldSurface, borderColor: colors.gold }]}>
          <Text variant="caption" tone="gold" style={styles.uppercase}>
            {isLive ? "Store live" : "Store being set up"}
          </Text>
          <Text variant="screenTitle" tone="primary" style={styles.welcomeTitle}>
            Welcome back, {data.vendor.companyName}
          </Text>
          <Text variant="body" tone="secondary" style={styles.welcomeSubtitle}>
            {data.newOrdersTotal > 0
              ? `You have ${data.newOrdersTotal} new order${data.newOrdersTotal === 1 ? "" : "s"} waiting on you.`
              : "No new orders right now — good time to tidy up your listings."}
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: "/(vendor)/orders", params: { status: "PENDING" } })}
            style={[styles.primaryAction, { backgroundColor: data.newOrdersTotal > 0 ? colors.pink : "transparent", borderColor: colors.pink }]}
          >
            <Ionicons name="clipboard-outline" size={16} color={data.newOrdersTotal > 0 ? colors.textOnAccent : colors.pink} />
            <Text variant="bodyMedium" tone={data.newOrdersTotal > 0 ? "onAccent" : "pink"}>
              {data.newOrdersTotal > 0 ? `Review ${data.newOrdersTotal} new order${data.newOrdersTotal === 1 ? "" : "s"}` : "View orders"}
            </Text>
          </Pressable>
        </View>

        {data.orderIssues.length > 0 || data.listingsNeedingAttention.length > 0 ? (
          <View style={styles.section}>
            <Text variant="sectionHeading" tone="primary">
              Needs your attention
            </Text>
            <View style={styles.attentionList}>
              {data.orderIssues.map((order) => (
                <Pressable
                  key={order.id}
                  onPress={() => router.push({ pathname: "/vendor-orders/[id]", params: { id: order.id } })}
                  style={[styles.attentionRow, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}
                >
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <View style={styles.flex}>
                    <Text variant="bodyMedium" tone="primary">
                      Order {order.orderNumber}
                    </Text>
                    <Text variant="small" tone="secondary">
                      An issue was reported on this order.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
              {data.listingsNeedingAttention.map((listing) => (
                <Pressable
                  key={listing.id}
                  onPress={() => router.push({ pathname: "/vendor-listings/[id]", params: { id: listing.id } })}
                  style={[styles.attentionRow, { backgroundColor: colors.warningSurface, borderColor: colors.warning }]}
                >
                  <Ionicons name="create-outline" size={18} color={colors.warning} />
                  <View style={styles.flex}>
                    <Text variant="bodyMedium" tone="primary" numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text variant="small" tone="secondary" numberOfLines={1}>
                      {listing.changesRequestedReason}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {data.newOrders.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="sectionHeading" tone="primary">
                New orders
              </Text>
              <Pressable onPress={() => router.push({ pathname: "/(vendor)/orders", params: { status: "PENDING" } })}>
                <Text variant="small" tone="pink">
                  View all
                </Text>
              </Pressable>
            </View>
            <View style={[styles.groupedList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {data.newOrders.map((order, index) => (
                <Pressable
                  key={order.id}
                  onPress={() => router.push({ pathname: "/vendor-orders/[id]", params: { id: order.id } })}
                  style={[styles.groupedRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                >
                  <View style={styles.flex}>
                    <Text variant="bodyMedium" tone="primary">
                      {order.orderNumber}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"} · qty {order.totalQuantity}
                    </Text>
                  </View>
                  <Text variant="small" tone="pink">
                    Prepare →
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text variant="sectionHeading" tone="primary">
            Your listings at a glance
          </Text>
          <View style={styles.statGrid}>
            <StatTile icon="checkmark-circle-outline" label="Active" value={data.stats.active} />
            <StatTile icon="time-outline" label="Pending review" value={data.stats.pendingReview} />
            <StatTile icon="document-outline" label="Drafts" value={data.stats.drafts} />
            <StatTile icon="close-circle-outline" label="Out of stock" value={data.stats.outOfStock} warn />
            <StatTile icon="alert-circle-outline" label="Low stock" value={data.stats.lowStock} warn />
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/(vendor)/finance")}
          style={[styles.financeCard, { backgroundColor: colors.textPrimary }]}
        >
          <View style={[styles.financeIcon, { backgroundColor: colors.goldSurface }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.goldStrong} />
          </View>
          <View style={styles.flex}>
            <Text variant="caption" tone="inverse">
              Available for payout
            </Text>
            <Text variant="sectionHeading" tone="inverse">
              {formatMoney(data.finance.availableForSettlement)}
            </Text>
          </View>
          <Text variant="small" tone="gold">
            View finance →
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/vendor-listings/new")}
          style={[styles.createListingButton, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
        >
          <Ionicons name="add" size={18} color={colors.textSecondary} />
          <Text variant="bodyMedium" tone="secondary">
            Create a new listing
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: Spacing.lg },
  loading: { padding: Spacing.md, gap: Spacing.md },
  welcomeBand: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.xxs },
  uppercase: { letterSpacing: 0.5 },
  welcomeTitle: { marginTop: 2 },
  welcomeSubtitle: { marginTop: 2 },
  primaryAction: {
    marginTop: Spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  section: { gap: Spacing.sm },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  attentionList: { gap: Spacing.xs },
  attentionRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  flex: { flex: 1 },
  groupedList: { borderRadius: Radius.lg, borderWidth: 1, overflow: "hidden" },
  groupedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.md },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  statTile: { width: "31%", borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.sm, gap: 4 },
  statIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  financeCard: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.lg },
  financeIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  createListingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
});
