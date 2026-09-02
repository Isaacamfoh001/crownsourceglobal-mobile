import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { IconSize, Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useOrderSummary } from "@/features/orders/useOrderSummary";

/**
 * Order confirmation (M25) — shown only after payment is independently
 * verified server-side (the payment screen only routes here on a
 * SUCCEEDED status from `GET /api/v1/payments/:id`). Reads the real Order
 * via `useOrderSummary` rather than trusting anything carried over from
 * navigation params — a fresh read guarantees this reflects the Order the
 * backend actually confirmed, including for the case where the customer
 * returns to the app later, or the confirmation came via the Paystack
 * webhook rather than the in-app poll.
 */
export default function OrderConfirmationScreen() {
  const { colors } = useAppTheme();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const orderQuery = useOrderSummary(orderId);
  const order = orderQuery.data;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      {orderQuery.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={200} radius={Radius.lg} />
        </View>
      )}

      {orderQuery.isError && <ErrorState title="Couldn't load your order" message={friendlyErrorMessage(orderQuery.error)} onRetry={() => orderQuery.refetch()} />}

      {order && (
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: colors.successSurface }]}>
            <Ionicons name={order.status === "CONFIRMED" ? "checkmark-circle" : "time-outline"} size={IconSize.xl * 1.4} color={colors.success} />
          </View>

          <Text variant="screenTitle" tone="primary" style={styles.title}>
            {order.status === "CONFIRMED" ? "Order confirmed" : "Order placed"}
          </Text>
          <Text variant="body" tone="secondary" style={styles.subtitle}>
            {order.status === "CONFIRMED"
              ? "Your payment was successful and vendors have been notified."
              : "We're finishing confirmation — you'll be notified as soon as it's ready."}
          </Text>

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
                Amount paid
              </Text>
              <Text variant="bodyMedium" tone="primary">
                {formatMoney({ amount: order.total.toFixed(2), currency: order.currency })}
              </Text>
            </View>
            <View style={[styles.cardRow, styles.cardRowSpaced]}>
              <Text variant="small" tone="muted">
                Payment status
              </Text>
              <Text variant="bodyMedium" tone={order.paymentStatus === "PAID" ? "success" : "secondary"}>
                {order.paymentStatus === "PAID" ? "Paid" : "Pending confirmation"}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button label="View Order" onPress={() => router.replace({ pathname: "/orders/[id]", params: { id: order.id } })} fullWidth />
            <Button label="Continue Shopping" onPress={() => router.replace("/(tabs)/shop")} variant="outline" fullWidth style={styles.secondaryAction} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingBlock: { padding: Spacing.md, marginTop: Spacing.xxl },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.xl },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  title: { marginTop: Spacing.lg, textAlign: "center" },
  subtitle: { marginTop: Spacing.xs, textAlign: "center", lineHeight: 20 },
  card: { width: "100%", marginTop: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardRowSpaced: { marginTop: Spacing.xs },
  actions: { width: "100%", marginTop: Spacing.xl },
  secondaryAction: { marginTop: Spacing.sm },
});
