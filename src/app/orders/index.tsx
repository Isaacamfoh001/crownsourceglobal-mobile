import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/features/orders/useOrders";
import { orderStatus } from "@/lib/orderStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { OrderListItemDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Customer order history (M26) — the post-purchase analogue of Beauty
 * Services'/Sourcing's "My requests" list. Newest-first, paginated (never
 * an unbounded list — CLAUDE.md §3/§26). A trust-sensitive surface (the
 * customer has paid real money here), so this deliberately reads as a
 * commerce order list, never an admin table: product imagery, a clear
 * status pill, strong price hierarchy.
 */
export default function OrdersListScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const feedQuery = useOrders(status === "SIGNED_IN");

  const rows = useMemo<OrderListItemDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text variant="sectionHeading" tone="primary">
        Your orders
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (status === "SIGNED_OUT") {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Sign in required" message="Sign in to see your orders." actionLabel="Sign in" onAction={() => router.push("/(auth)/sign-in")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      {header}

      {feedQuery.isPending && !feedQuery.isError ? (
        <View style={styles.loadingBlock}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} height={92} radius={16} />
          ))}
        </View>
      ) : feedQuery.isError ? (
        <ErrorState title="Couldn't load your orders" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
      ) : (
        <FlatList
          style={styles.flex}
          data={rows}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
          }}
          refreshing={feedQuery.isRefetching && !feedQuery.isFetchingNextPage}
          onRefresh={() => feedQuery.refetch()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No orders yet" message="Once you place an order, it will show up here." actionLabel="Start shopping" onAction={() => router.push("/(tabs)/shop")} />
          }
          renderItem={({ item }) => <OrderRow order={item} />}
          ListFooterComponent={feedQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

function OrderRow({ order }: { order: OrderListItemDTO }) {
  const { colors } = useAppTheme();
  const info = orderStatus.display(order.displayStatus);

  return (
    <Pressable onPress={() => router.push({ pathname: "/orders/[id]", params: { id: order.id } })} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="button">
      {order.thumbnailUrl ? (
        <Image source={{ uri: order.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name="cube-outline" size={22} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text variant="cardTitle" tone="primary" numberOfLines={1} style={styles.cardTitle}>
            {order.orderNumber}
          </Text>
          <StatusBadge label={info.label} tone={info.tone} />
        </View>
        <Text variant="small" tone="secondary">
          {formatDate(order.createdAt)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
          {order.vendorCount > 1 ? ` · ${order.vendorCount} vendors` : ""}
        </Text>
        <Text variant="bodyMedium" tone="primary" style={styles.priceLine}>
          {formatMoney({ amount: order.total.toFixed(2), currency: order.currency })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  separator: { height: Spacing.sm },
  card: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: Radius.md },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  cardTitle: { flex: 1 },
  priceLine: { marginTop: 2 },
  footerLoader: { marginVertical: Spacing.md },
});
