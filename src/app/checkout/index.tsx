import { useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { PickerModal } from "@/components/ui/PickerModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { GHANA_REGIONS } from "@/constants/ghanaRegions";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useCart } from "@/features/cart/useCart";
import { useAddresses } from "@/features/addresses/useAddresses";
import { useCheckout } from "@/features/checkout/useCheckout";
import type { AddressDTO } from "@/types/api";

/**
 * Native Checkout (M25) — delivery details + order summary, then
 * `POST /api/v1/checkout` creates the real PENDING_PAYMENT Order (reusing
 * ordersService.createOrderFromCart, same as web). Server-authoritative:
 * this screen only ever displays what `useCart` already resolved live —
 * it never computes or sends a total. Same delivery-form shape as M24's
 * quote-acceptance screen (quotations/[id].tsx), including reusing saved
 * addresses.
 */
export default function CheckoutScreen() {
  const { colors } = useAppTheme();
  const cartQuery = useCart(true);
  const addressesQuery = useAddresses(true);
  const checkout = useCheckout();

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

  const cart = cartQuery.data;
  const canSubmit =
    recipientName.trim().length >= 2 &&
    phone.trim().length >= 9 &&
    addressLine1.trim().length >= 3 &&
    city.trim().length >= 2 &&
    region.trim().length > 0 &&
    !checkout.isPending;

  function onSubmit() {
    if (!canSubmit) return;
    checkout.mutate(
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
        onSuccess: (result) => {
          router.replace({ pathname: "/checkout/[orderId]/payment", params: { orderId: result.orderId } });
        },
      },
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text variant="sectionHeading" tone="primary">
          Checkout
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {cartQuery.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={140} radius={Radius.lg} />
          <Skeleton height={90} radius={Radius.lg} style={styles.gap} />
        </View>
      )}

      {cartQuery.isError && (
        <ErrorState title="Couldn't load your cart" message={friendlyErrorMessage(cartQuery.error)} onRetry={() => cartQuery.refetch()} />
      )}

      {cart && cart.vendorGroups.length === 0 && !cartQuery.isPending && (
        <EmptyState icon="bag-handle-outline" title="Your cart is empty" message="Add something to your cart before checking out." actionLabel="Browse Shop" onAction={() => router.replace("/(tabs)/shop")} />
      )}

      {cart && cart.vendorGroups.length > 0 && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text variant="sectionHeading" tone="primary">
              Delivery
            </Text>

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

            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text variant="bodyMedium" tone="primary" style={styles.summaryTitle}>
                Order summary
              </Text>
              {cart.vendorGroups.map((group) => (
                <View key={group.vendor.id} style={styles.summaryVendor}>
                  <Text variant="small" tone="muted">
                    {group.vendor.companyName.toUpperCase()}
                  </Text>
                  {group.lines.map((line) => (
                    <View key={line.id} style={styles.summaryLine}>
                      <Text variant="body" tone="secondary" numberOfLines={1} style={styles.summaryLineLabel}>
                        {line.title} × {line.quantity}
                      </Text>
                      <Text variant="bodyMedium" tone="primary">
                        {formatMoney(line.lineTotal)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
              <View style={[styles.summaryTotalRow, { borderTopColor: colors.border }]}>
                <Text variant="bodyMedium" tone="secondary">
                  Subtotal
                </Text>
                <Text variant="cardTitle" tone="primary">
                  {formatMoney(cart.subtotal)}
                </Text>
              </View>
              <Text variant="small" tone="muted" style={styles.summaryHint}>
                Final totals are confirmed on the next screen before payment.
              </Text>
            </View>

            {checkout.isError && (
              <Text variant="small" tone="error" style={styles.errorText}>
                {friendlyErrorMessage(checkout.error)}
              </Text>
            )}

            <Button label={checkout.isPending ? "Placing order…" : "Continue to Payment"} onPress={onSubmit} disabled={!canSubmit} loading={checkout.isPending} fullWidth style={styles.submitButton} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <PickerModal visible={regionPickerOpen} title="Region" options={GHANA_REGIONS} selected={region} onSelect={setRegion} onClose={() => setRegionPickerOpen(false)} searchable={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: TouchTarget },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  savedAddressList: { gap: Spacing.xs, marginBottom: Spacing.xs },
  savedAddressRow: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm },
  input: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: 15 },
  rowInputs: { flexDirection: "row", gap: Spacing.sm },
  rowInput: { flex: 1 },
  selectInput: { justifyContent: "center" },
  notesInput: { minHeight: 64, paddingTop: Spacing.sm, textAlignVertical: "top" },
  summaryCard: { marginTop: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.xs },
  summaryTitle: { marginBottom: 2 },
  summaryVendor: { marginTop: Spacing.xs, gap: 2 },
  summaryLine: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm, paddingVertical: 2 },
  summaryLineLabel: { flex: 1 },
  summaryTotalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, marginTop: Spacing.xs },
  summaryHint: { marginTop: 2 },
  errorText: { marginTop: Spacing.xxs },
  submitButton: { marginTop: Spacing.xs },
});
