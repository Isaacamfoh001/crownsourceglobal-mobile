import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import {
  useVendorOrderDetail,
  useStartPreparingOrder,
  useMarkOrderReady,
  useShipVendorOrder,
  useReportOrderIssue,
} from "@/features/vendor/useVendorOrders";

const ISSUE_REPORTABLE_STATUSES = ["PENDING", "PREPARING", "READY"];

export default function VendorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorOrderDetail(ready ? id : undefined);

  if (!ready) return null;

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={20} width={160} radius={Radius.sm} />
          <Skeleton height={160} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState title="Couldn't load this order" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const order = query.data;
  const info = vendorStatus.fulfilment(order.status);
  const canReportIssue = ISSUE_REPORTABLE_STATUSES.includes(order.status) && !order.openIssue;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            {order.orderNumber}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <StatusBadge label={info.label} tone={info.tone} />
          <Text variant="small" tone="muted">
            {order.origin === "INTERNATIONAL_INBOUND" ? "International" : "Domestic collection"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary">
            Items
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {order.items.map((item, index) => (
              <View key={item.id} style={[styles.itemRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text variant="body" tone="primary" style={styles.flex}>
                  {item.description}
                </Text>
                <Text variant="body" tone="secondary">
                  ×{item.quantity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {order.openIssue ? (
          <View style={[styles.notice, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
            <Text variant="smallMedium" tone="error">
              Issue reported: {order.openIssue.category}
            </Text>
            <Text variant="small" tone="secondary">
              {order.openIssue.description}
            </Text>
            <Text variant="caption" tone="muted" style={styles.marginTop}>
              CrownSourceGlobal operations is reviewing this.
            </Text>
          </View>
        ) : null}

        {order.shipment ? (
          <View style={styles.section}>
            <Text variant="smallMedium" tone="secondary">
              Shipment
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text variant="body" tone="primary">
                {order.shipment.carrier ?? "Carrier not set"} {order.shipment.trackingReference ? `· ${order.shipment.trackingReference}` : ""}
              </Text>
              <Text variant="small" tone="secondary">
                Status: {order.shipment.status}
              </Text>
            </View>
          </View>
        ) : null}

        <ActionSection order={order} canReportIssue={canReportIssue} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function ActionSection({ order, canReportIssue }: { order: NonNullable<ReturnType<typeof useVendorOrderDetail>["data"]>; canReportIssue: boolean }) {
  const { colors } = useAppTheme();
  const startPreparing = useStartPreparingOrder();
  const markReady = useMarkOrderReady();
  const ship = useShipVendorOrder();
  const reportIssue = useReportOrderIssue();

  const [showShipForm, setShowShipForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [trackingReference, setTrackingReference] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const actionError = startPreparing.error ?? markReady.error ?? ship.error ?? reportIssue.error;

  return (
    <View style={styles.section}>
      {actionError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(actionError)}
        </Text>
      ) : null}

      {order.status === "PENDING" ? (
        <Button
          label={startPreparing.isPending ? "Starting…" : "Start preparing"}
          onPress={() => startPreparing.mutate(order.id)}
          disabled={startPreparing.isPending}
          loading={startPreparing.isPending}
          fullWidth
        />
      ) : null}

      {order.status === "PREPARING" ? (
        <Button label={markReady.isPending ? "Marking ready…" : "Mark ready"} onPress={() => markReady.mutate(order.id)} disabled={markReady.isPending} loading={markReady.isPending} fullWidth />
      ) : null}

      {order.status === "READY" && order.origin === "INTERNATIONAL_INBOUND" ? (
        showShipForm ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextField label="Carrier" value={carrier} onChangeText={setCarrier} />
            <TextField label="Tracking reference" value={trackingReference} onChangeText={setTrackingReference} />
            <Button
              label={ship.isPending ? "Recording…" : "Confirm shipped"}
              onPress={() => {
                if (!carrier.trim() || !trackingReference.trim() || ship.isPending) return;
                ship.mutate(
                  { orderId: order.id, carrier, trackingReference, shippedAt: new Date().toISOString() },
                  { onSuccess: () => setShowShipForm(false) },
                );
              }}
              disabled={ship.isPending}
              loading={ship.isPending}
              fullWidth
              style={styles.marginTop}
            />
          </View>
        ) : (
          <Button label="Record shipment" onPress={() => setShowShipForm(true)} fullWidth />
        )
      ) : null}

      {order.status === "READY" && order.origin === "DOMESTIC_COLLECTION" ? (
        <Text variant="small" tone="secondary">
          Ready for CrownSourceGlobal collection.
        </Text>
      ) : null}

      {canReportIssue ? (
        showIssueForm ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextField label="Category" value={issueCategory} onChangeText={setIssueCategory} placeholder="e.g. Out of stock" />
            <View style={styles.fieldWrap}>
              <Text variant="smallMedium" tone="secondary">
                What happened?
              </Text>
              <TextInput
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
                placeholderTextColor={colors.textMuted}
                style={[styles.multiline, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.bg }]}
              />
            </View>
            <Button
              label={reportIssue.isPending ? "Reporting…" : "Report issue"}
              variant="outline"
              onPress={() => {
                if (issueCategory.trim().length < 2 || issueDescription.trim().length < 5 || reportIssue.isPending) return;
                reportIssue.mutate(
                  { orderId: order.id, category: issueCategory, description: issueDescription },
                  {
                    onSuccess: () => {
                      setShowIssueForm(false);
                      Alert.alert("Issue reported", "CrownSourceGlobal operations will review it.");
                    },
                  },
                );
              }}
              disabled={reportIssue.isPending}
              loading={reportIssue.isPending}
              fullWidth
              style={styles.marginTop}
            />
          </View>
        ) : (
          <Button label="Report an issue" variant="outline" onPress={() => setShowIssueForm(true)} fullWidth />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md },
  section: { padding: Spacing.md, gap: Spacing.sm },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.xs },
  notice: { marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, gap: 2 },
  fieldWrap: { gap: Spacing.xxs },
  multiline: { minHeight: 70, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, fontSize: 14, textAlignVertical: "top" },
  marginTop: { marginTop: Spacing.xs },
});
