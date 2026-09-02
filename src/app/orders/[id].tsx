import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useOrderSummary } from "@/features/orders/useOrderSummary";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Minimal Order Detail (M25) — order number, status, payment status, total,
 * date. Deliberately NOT the full M26 Orders/Fulfilment experience: no
 * vendor/fulfilment breakdown, no shipment tracking, no messages. Reuses
 * the same minimal `GET /api/v1/orders/:id` endpoint M24 introduced for
 * the quote-acceptance confirmation card — this screen exists so "View
 * Order" (from checkout confirmation) has somewhere honest to return to,
 * without pulling in M26's scope ahead of time.
 */
export default function OrderDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderQuery = useOrderSummary(id);
  const order = orderQuery.data;

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text variant="sectionHeading" tone="primary">
          Order
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {orderQuery.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={180} radius={Radius.lg} />
        </View>
      )}

      {orderQuery.isError && <ErrorState title="Couldn't load this order" message={friendlyErrorMessage(orderQuery.error)} onRetry={() => orderQuery.refetch()} />}

      {order && (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
              <Text variant="small" tone="muted">
                Order number
              </Text>
              <Text variant="bodyMedium" tone="primary">
                {order.orderNumber}
              </Text>
            </View>
            <View style={[styles.cardRow, styles.cardRowSpaced]}>
              <Text variant="small" tone="muted">
                Placed
              </Text>
              <Text variant="bodyMedium" tone="primary">
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <View style={[styles.cardRow, styles.cardRowSpaced]}>
              <Text variant="small" tone="muted">
                Status
              </Text>
              <Text variant="bodyMedium" tone="primary">
                {order.status}
              </Text>
            </View>
            <View style={[styles.cardRow, styles.cardRowSpaced]}>
              <Text variant="small" tone="muted">
                Payment
              </Text>
              <Text variant="bodyMedium" tone={order.paymentStatus === "PAID" ? "success" : "secondary"}>
                {order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus}
              </Text>
            </View>
            <View style={[styles.cardRow, styles.cardRowSpaced, styles.totalRow, { borderTopColor: colors.border }]}>
              <Text variant="bodyMedium" tone="secondary">
                Total
              </Text>
              <Text variant="cardTitle" tone="primary">
                {formatMoney({ amount: order.total.toFixed(2), currency: order.currency })}
              </Text>
            </View>
          </View>

          {order.status === "PENDING_PAYMENT" && (
            <Button label="Complete payment" onPress={() => router.push({ pathname: "/checkout/[orderId]/payment", params: { orderId: order.id } })} fullWidth style={styles.payButton} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: TouchTarget },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  content: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardRowSpaced: { marginTop: Spacing.xs },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  payButton: { marginTop: Spacing.md },
});
