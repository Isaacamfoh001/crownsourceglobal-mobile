import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { orderStatus } from "@/lib/orderStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useOrderDetail } from "@/features/orders/useOrders";
import type { OrderCaseSummaryDTO, OrderDetailDTO, OrderPackageTrackingDTO, OrderVendorGroupDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Full customer Order Detail (M26) — replaces the M25 minimal read (order
 * number/status/payment/total only). Same backend `GET /api/v1/orders/:id`
 * route, now returning the full OrderDetailDTO (superset — every M25 field
 * still there). A multi-vendor Order is never collapsed into one fake
 * status: each vendor's package gets its own timeline, and the overall
 * status shown at the top is the LEAST-advanced package's status (see the
 * backend's computeOrderDisplayStatus doc comment).
 */
export default function OrderDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderQuery = useOrderDetail(id);
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
          <Skeleton height={64} radius={Radius.lg} />
          <Skeleton height={140} radius={Radius.lg} style={styles.gap} />
          <Skeleton height={180} radius={Radius.lg} style={styles.gap} />
        </View>
      )}

      {orderQuery.isError && <ErrorState title="Couldn't load this order" message={friendlyErrorMessage(orderQuery.error)} onRetry={() => orderQuery.refetch()} />}

      {order && <OrderDetailContent order={order} />}
    </SafeAreaView>
  );
}

function OrderDetailContent({ order }: { order: OrderDetailDTO }) {
  const { colors } = useAppTheme();
  const info = orderStatus.display(order.displayStatus);
  const multiVendor = order.vendorGroups.length > 1;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text variant="cardTitle" tone="primary">
            {order.orderNumber}
          </Text>
          <Text variant="small" tone="muted">
            Placed {formatDate(order.createdAt)}
          </Text>
        </View>
        <StatusBadge label={info.label} tone={info.tone} />
      </View>

      {order.status === "PENDING_PAYMENT" && (
        <View style={[styles.noticeCard, { backgroundColor: colors.warningSurface, borderColor: colors.warning }]}>
          <Text variant="bodyMedium" tone="warning">
            Awaiting payment
          </Text>
          <Text variant="small" tone="secondary" style={styles.noticeText}>
            Complete payment to confirm this order with the vendor.
          </Text>
          <Button label="Complete payment" onPress={() => router.push({ pathname: "/checkout/[orderId]/payment", params: { orderId: order.id } })} style={styles.noticeButton} />
        </View>
      )}

      {order.tracking.length > 0 && (
        <View style={styles.section}>
          {multiVendor && (
            <Text variant="small" tone="secondary" style={styles.sectionIntro}>
              Your order will arrive in {order.tracking.length} deliveries, one per vendor.
            </Text>
          )}
          {order.tracking.map((pkg) => (
            <PackageTrackingCard key={pkg.fulfilmentId} tracking={pkg} showVendorName={multiVendor} />
          ))}
        </View>
      )}

      {order.cases.length > 0 && (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            ISSUE REPORTED
          </Text>
          <View style={[styles.groupedList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {order.cases.map((c, index) => (
              <CaseRow key={c.id} caseRow={c} isFirst={index === 0} />
            ))}
          </View>
        </View>
      )}

      {order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED" && (
        <Pressable
          onPress={() => router.push({ pathname: "/resolutions/new", params: { orderId: order.id } })}
          style={[styles.reportProblemRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Ionicons name="alert-circle-outline" size={18} color={colors.textSecondary} />
          <Text variant="bodyMedium" tone="secondary" style={styles.flex}>
            Report a problem
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      )}

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          ITEMS
        </Text>
        {order.vendorGroups.map((group) => (
          <VendorGroupCard key={group.vendorName} group={group} currency={order.currency} />
        ))}
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <Text variant="small" tone="secondary">
            Subtotal
          </Text>
          <Text variant="small" tone="primary">
            {formatMoney({ amount: order.subtotal.toFixed(2), currency: order.currency })}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
          <Text variant="bodyMedium" tone="secondary">
            Total
          </Text>
          <Text variant="cardTitle" tone="primary">
            {formatMoney({ amount: order.total.toFixed(2), currency: order.currency })}
          </Text>
        </View>
      </View>

      {order.latestPayment && (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            PAYMENT
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="body" tone="primary">
              {order.latestPayment.method === "MOBILE_MONEY"
                ? `Mobile Money${order.latestPayment.network ? ` (${order.latestPayment.network})` : ""}`
                : order.latestPayment.method === "CARD"
                  ? `Card${order.latestPayment.cardDisplay ? ` (${order.latestPayment.cardDisplay.brand} •••• ${order.latestPayment.cardDisplay.last4})` : ""}`
                  : "Development payment"}
              {order.latestPayment.phoneMasked ? ` · ${order.latestPayment.phoneMasked}` : ""}
            </Text>
            <Text variant="small" tone="secondary" style={styles.paymentAmount}>
              {formatMoney({ amount: order.latestPayment.amount.toFixed(2), currency: order.latestPayment.currency })}
            </Text>
            <Text variant="caption" tone="muted" style={styles.paymentRef}>
              Ref: {order.latestPayment.reference}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          DELIVERY TO
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="bodyMedium" tone="primary">
            {order.deliveryInfo.recipientName}
          </Text>
          <Text variant="small" tone="secondary">
            {order.deliveryInfo.phone}
          </Text>
          <Text variant="small" tone="secondary" style={styles.addressLine}>
            {order.deliveryInfo.addressLine1}
            {order.deliveryInfo.addressLine2 ? `, ${order.deliveryInfo.addressLine2}` : ""}
          </Text>
          <Text variant="small" tone="secondary">
            {order.deliveryInfo.city}, {order.deliveryInfo.region}
          </Text>
          {order.deliveryInfo.notes ? (
            <Text variant="small" tone="muted" style={styles.deliveryNotes}>
              Note: {order.deliveryInfo.notes}
            </Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function PackageTrackingCard({ tracking, showVendorName }: { tracking: OrderPackageTrackingDTO; showVendorName: boolean }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, styles.trackingCard, { backgroundColor: colors.surface, borderColor: tracking.hasIssue ? colors.error : colors.border }]}>
      {showVendorName && (
        <Text variant="smallMedium" tone="primary" style={styles.trackingVendor}>
          {tracking.vendorName}
        </Text>
      )}

      {tracking.hasIssue && (
        <View style={[styles.issueChip, { backgroundColor: colors.errorSurface }]}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <Text variant="caption" tone="error">
            Issue reported for this delivery
          </Text>
        </View>
      )}

      <View style={styles.timeline}>
        {tracking.steps.map((step, index) => {
          const isLast = index === tracking.steps.length - 1;
          const dotColor = step.done || step.current ? colors.pink : colors.border;
          return (
            <View key={step.key} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: dotColor }, step.current && styles.timelineDotCurrent, step.current && { borderColor: colors.pink }]} />
                {!isLast && <View style={[styles.timelineLine, { backgroundColor: step.done ? colors.pink : colors.border }]} />}
              </View>
              <View style={styles.timelineLabel}>
                <Text variant={step.current ? "bodyMedium" : "small"} tone={step.done || step.current ? "primary" : "muted"}>
                  {step.label}
                </Text>
                {step.at && (
                  <Text variant="caption" tone="muted">
                    {formatDateTime(step.at)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {tracking.trackingReference && (
        <View style={[styles.trackingRefRow, { borderTopColor: colors.border }]}>
          <Text variant="caption" tone="muted">
            {tracking.carrier ? `${tracking.carrier} · ` : ""}Tracking number (tap and hold to copy)
          </Text>
          <Text variant="small" tone="primary" selectable>
            {tracking.trackingReference}
          </Text>
        </View>
      )}
    </View>
  );
}

function CaseRow({ caseRow, isFirst }: { caseRow: OrderCaseSummaryDTO; isFirst: boolean }) {
  const { colors } = useAppTheme();
  const info = orderStatus.resolutionCase(caseRow.status);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/resolutions/[id]", params: { id: caseRow.id } })}
      accessibilityRole="button"
      style={[styles.caseRowButton, !isFirst && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
    >
      <View style={styles.caseRowBody}>
        <Text variant="body" tone="primary">
          {caseRow.caseNumber}
        </Text>
        <StatusBadge label={info.label} tone={info.tone} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function VendorGroupCard({ group, currency }: { group: OrderVendorGroupDTO; currency: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="caption" tone="muted" style={styles.vendorLabel}>
        {group.vendorName.toUpperCase()}
      </Text>
      {group.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} contentFit="cover" />
          ) : (
            <View style={[styles.itemThumb, styles.itemThumbFallback, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.flex}>
            <Text variant="body" tone="primary" numberOfLines={2}>
              {item.description}
            </Text>
            <Text variant="small" tone="muted">
              Qty {item.quantity} · {formatMoney({ amount: item.unitPrice.toFixed(2), currency })} each
            </Text>
          </View>
          <Text variant="bodyMedium" tone="primary">
            {formatMoney({ amount: item.lineTotal.toFixed(2), currency })}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: TouchTarget },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl, gap: Spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  noticeCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  noticeText: { marginTop: 2 },
  noticeButton: { marginTop: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionIntro: { marginBottom: 2 },
  sectionLabel: { letterSpacing: 0.5 },
  reportProblemRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: 4 },
  trackingCard: { gap: Spacing.sm },
  trackingVendor: { marginBottom: 2 },
  issueChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: Spacing.xs, paddingVertical: 4, borderRadius: Radius.sm },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: "row", gap: Spacing.sm },
  timelineRail: { alignItems: "center", width: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineDotCurrent: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  timelineLine: { width: 2, flex: 1, minHeight: 20, marginVertical: 2 },
  timelineLabel: { flex: 1, paddingBottom: Spacing.sm },
  trackingRefRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, marginTop: 2 },
  groupedList: { borderRadius: Radius.lg, borderWidth: 1, overflow: "hidden" },
  caseRowButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  caseRowBody: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  vendorLabel: { letterSpacing: 0.5, marginBottom: 2 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: 6 },
  itemThumb: { width: 40, height: 40, borderRadius: Radius.sm },
  itemThumbFallback: { alignItems: "center", justifyContent: "center" },
  summaryCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  paymentAmount: { marginTop: 2 },
  paymentRef: { marginTop: 2 },
  addressLine: { marginTop: 2 },
  deliveryNotes: { marginTop: 4 },
});
