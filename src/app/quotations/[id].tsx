import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { QuotationStatusBadge } from "@/components/ui/QuotationStatusBadge";
import { PickerModal } from "@/components/ui/PickerModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { GHANA_REGIONS } from "@/constants/ghanaRegions";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useQuotationDetail } from "@/features/quotations/useQuotations";
import { useAcceptQuotation } from "@/features/quotations/useAcceptQuotation";
import { useAddresses } from "@/features/addresses/useAddresses";
import { useOrderSummary } from "@/features/orders/useOrderSummary";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { AddressDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function QuotationDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuotationDetail(id);
  const quotation = query.data;

  const [acceptFormOpen, setAcceptFormOpen] = useState(false);

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          Quotation
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {query.isPending ? (
        <View style={styles.loadingBlock}>
          <Skeleton height={20} width="50%" />
          <Skeleton height={60} style={styles.gap} />
          <Skeleton height={80} style={styles.gap} />
        </View>
      ) : query.isError || !quotation ? (
        <ErrorState title="Couldn't load this quotation" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.titleRow}>
            <Text variant="cardTitle" tone="primary">
              {quotation.reference}
            </Text>
            <QuotationStatusBadge status={quotation.status} />
          </View>
          <Text variant="small" tone="muted">
            Issued {formatDate(quotation.issuedAt)}
            {quotation.status === "ISSUED" ? ` · Valid until ${formatDate(quotation.expiresAt)}` : ""}
          </Text>

          <View style={[styles.itemsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {quotation.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.flex}>
                  <Text variant="body" tone="primary" numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text variant="small" tone="muted">
                    {item.quantity} × {quotation.currency} {item.unitPrice.toFixed(2)}
                  </Text>
                </View>
                <Text variant="bodyMedium" tone="primary">
                  {quotation.currency} {item.lineTotal.toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text variant="bodyMedium" tone="secondary">
                Total
              </Text>
              <Text variant="cardTitle" tone="primary">
                {quotation.currency} {quotation.total.toFixed(2)}
              </Text>
            </View>
          </View>

          {quotation.status === "EXPIRED" ? (
            <View style={[styles.noticeCard, { backgroundColor: colors.surfaceSubtle }]}>
              <Text variant="body" tone="secondary">
                This quotation has expired. Contact CrownSourceGlobal if you&apos;d like an updated quote.
              </Text>
            </View>
          ) : null}

          {quotation.status === "ACCEPTED" && quotation.acceptedOrderId ? (
            <AcceptedOrderCard orderId={quotation.acceptedOrderId} />
          ) : null}

          {quotation.status === "ISSUED" && !acceptFormOpen ? (
            <Button label="Accept quotation" onPress={() => setAcceptFormOpen(true)} fullWidth style={styles.acceptButton} />
          ) : null}

          {quotation.status === "ISSUED" && acceptFormOpen ? <AcceptQuotationForm quotationId={quotation.id} onCancel={() => setAcceptFormOpen(false)} /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** Real order reference, and a real path to payment (M25) — reuses the same PENDING_PAYMENT-order Paystack flow as cart checkout, never a separate quotation-only payment system. */
function AcceptedOrderCard({ orderId }: { orderId: string }) {
  const { colors } = useAppTheme();
  const orderQuery = useOrderSummary(orderId);
  const order = orderQuery.data;
  const isPendingPayment = order?.status === "PENDING_PAYMENT";

  return (
    <View style={[styles.orderCard, { backgroundColor: colors.successSurface }]}>
      <Text variant="bodyMedium" tone="success">
        Quotation accepted
      </Text>
      {order ? (
        <Text variant="small" tone="secondary" style={styles.orderCardLine}>
          Order {order.orderNumber} · {order.currency} {order.total.toFixed(2)} · {isPendingPayment ? "Pending payment" : order.status}
        </Text>
      ) : (
        <Text variant="small" tone="secondary" style={styles.orderCardLine}>
          Your order has been created and is pending payment.
        </Text>
      )}
      {isPendingPayment && (
        <Button label="Pay now" onPress={() => router.push({ pathname: "/checkout/[orderId]/payment", params: { orderId } })} style={styles.payNowButton} />
      )}
    </View>
  );
}

function AcceptQuotationForm({ quotationId, onCancel }: { quotationId: string; onCancel: () => void }) {
  const { colors } = useAppTheme();
  const addressesQuery = useAddresses(true);
  const acceptMutation = useAcceptQuotation(quotationId);

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  function applyAddress(address: AddressDTO) {
    setSelectedAddressId(address.id);
    setRecipientName(address.recipientName);
    setPhone(address.phone);
    setAddressLine1(address.addressLine1);
    setAddressLine2(address.addressLine2 ?? "");
    setCity(address.city);
    setRegion(address.region);
  }

  const canSubmit =
    recipientName.trim().length >= 2 &&
    phone.trim().length >= 9 &&
    addressLine1.trim().length >= 3 &&
    city.trim().length >= 2 &&
    region.trim().length > 0 &&
    !acceptMutation.isPending;

  function onSubmit() {
    if (!canSubmit) return;
    acceptMutation.mutate(
      {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        region,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert("Quotation accepted", "Your order has been created and is pending payment. We'll notify you when in-app payment is available.");
        },
      },
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.formHeader}>
          <Text variant="bodyMedium" tone="primary">
            Delivery details
          </Text>
          <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel">
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {addressesQuery.data && addressesQuery.data.length > 0 ? (
          <View style={styles.savedAddressList}>
            {addressesQuery.data.map((address) => (
              <Pressable
                key={address.id}
                onPress={() => applyAddress(address)}
                style={[styles.savedAddressRow, { borderColor: selectedAddressId === address.id ? colors.pink : colors.border }]}
                accessibilityRole="button"
              >
                <Text variant="small" tone={selectedAddressId === address.id ? "pink" : "primary"} numberOfLines={2}>
                  {address.recipientName} · {address.addressLine1}, {address.city}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <TextInput value={recipientName} onChangeText={setRecipientName} placeholder="Recipient name" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]} />
        <TextInput value={addressLine1} onChangeText={setAddressLine1} placeholder="Delivery address" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]} />
        <TextInput
          value={addressLine2}
          onChangeText={setAddressLine2}
          placeholder="Apartment, suite, etc. (optional)"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
        />
        <View style={styles.rowInputs}>
          <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.textMuted} style={[styles.input, styles.rowInput, { borderColor: colors.border, color: colors.textPrimary }]} />
          <Pressable onPress={() => setRegionPickerOpen(true)} style={[styles.input, styles.rowInput, styles.selectInput, { borderColor: colors.border }]} accessibilityRole="button">
            <Text variant="body" tone={region ? "primary" : "muted"}>
              {region || "Region"}
            </Text>
          </Pressable>
        </View>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Delivery notes (optional)"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, styles.notesInput, { borderColor: colors.border, color: colors.textPrimary }]}
        />

        {acceptMutation.isError ? (
          <Text variant="small" tone="error" style={styles.errorText}>
            {friendlyErrorMessage(acceptMutation.error)}
          </Text>
        ) : null}

        <Button label={acceptMutation.isPending ? "Placing order…" : "Confirm & accept"} onPress={onSubmit} disabled={!canSubmit} loading={acceptMutation.isPending} fullWidth style={styles.submitButton} />
      </View>

      <PickerModal visible={regionPickerOpen} title="Region" options={GHANA_REGIONS} selected={region} onSelect={setRegion} onClose={() => setRegionPickerOpen(false)} searchable={false} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.xxs },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemsCard: { marginTop: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.sm, gap: Spacing.sm },
  itemRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, marginTop: Spacing.xxs },
  noticeCard: { borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md },
  orderCard: { borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md, gap: 2 },
  orderCardLine: { marginTop: 2 },
  payNowButton: { marginTop: Spacing.sm },
  acceptButton: { marginTop: Spacing.lg },
  formCard: { marginTop: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  savedAddressList: { gap: Spacing.xs, marginBottom: Spacing.xs },
  savedAddressRow: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm },
  input: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: 15 },
  rowInputs: { flexDirection: "row", gap: Spacing.sm },
  rowInput: { flex: 1 },
  selectInput: { justifyContent: "center" },
  notesInput: { minHeight: 64, paddingTop: Spacing.sm, textAlignVertical: "top" },
  errorText: { marginTop: Spacing.xxs },
  submitButton: { marginTop: Spacing.xs },
});
