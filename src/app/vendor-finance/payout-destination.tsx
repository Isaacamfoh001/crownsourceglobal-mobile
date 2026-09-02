import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorPayoutDestination, useUpdatePayoutDestination } from "@/features/vendor/useVendorFinance";
import { friendlyErrorMessage } from "@/lib/api/errors";

const NETWORKS = ["MTN", "TELECEL", "AT"] as const;

/**
 * Payout destination (M27 §20/§21) — display + edit only. No "Withdraw"
 * button: automated Paystack vendor payouts remain on manual fallback
 * (Starter Business tier), so mobile never pretends otherwise (M27 §20).
 * Full account numbers/phone numbers are never stored locally or shown —
 * the backend already masks them (GET returns *Masked fields only).
 */
export default function VendorPayoutDestinationScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorPayoutDestination(ready);
  const update = useUpdatePayoutDestination();

  const [type, setType] = useState<"MOBILE_MONEY" | "BANK_TRANSFER">("MOBILE_MONEY");
  const [momoAccountName, setMomoAccountName] = useState("");
  const [momoPhone, setMomoPhone] = useState("");
  const [momoNetwork, setMomoNetwork] = useState<(typeof NETWORKS)[number]>("MTN");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  // Re-sync once the destination loads — adjusted during render, not an
  // effect, same pattern as FallbackImage.tsx's own doc comment. Full
  // account numbers/phone numbers are never returned by the API (masked
  // fields only), so those inputs intentionally stay blank here.
  const [syncedDestination, setSyncedDestination] = useState(query.data);
  if (query.data !== syncedDestination) {
    setSyncedDestination(query.data);
    if (query.data) {
      setType(query.data.type);
      if (query.data.momoAccountName) setMomoAccountName(query.data.momoAccountName);
      if (query.data.momoNetwork) setMomoNetwork(query.data.momoNetwork as (typeof NETWORKS)[number]);
      if (query.data.bankAccountName) setBankAccountName(query.data.bankAccountName);
      if (query.data.bankName) setBankName(query.data.bankName);
    }
  }

  if (!ready) return null;

  const onSave = () => {
    if (update.isPending) return;
    if (type === "MOBILE_MONEY") {
      if (!momoAccountName.trim() || !momoPhone.trim()) return;
      update.mutate({ type: "MOBILE_MONEY", momoAccountName, momoPhone, momoNetwork });
    } else {
      if (!bankAccountName.trim() || !bankName.trim() || !bankAccountNumber.trim()) return;
      update.mutate({ type: "BANK_TRANSFER", bankAccountName, bankName, bankAccountNumber });
    }
  };

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          Payout destination
        </Text>
      </View>

      {query.isPending ? (
        <View style={styles.section}>
          <Skeleton height={120} radius={Radius.lg} />
        </View>
      ) : query.isError ? (
        <ErrorState title="Couldn't load payout details" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <View style={styles.section}>
          {query.data ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text variant="small" tone="muted">
                Current
              </Text>
              <Text variant="body" tone="primary">
                {query.data.type === "MOBILE_MONEY"
                  ? `${query.data.momoAccountName ?? ""} · ${query.data.momoNetwork ?? ""} · ${query.data.momoPhoneMasked ?? ""}`
                  : `${query.data.bankAccountName ?? ""} · ${query.data.bankName ?? ""} · ${query.data.bankAccountNumberMasked ?? ""}`}
              </Text>
            </View>
          ) : (
            <Text variant="small" tone="secondary">
              No payout destination set yet.
            </Text>
          )}

          <Text variant="smallMedium" tone="secondary" style={styles.marginTop}>
            Update destination
          </Text>
          <View style={styles.categoryRow}>
            <CategoryTile label="Mobile Money" selected={type === "MOBILE_MONEY"} onPress={() => setType("MOBILE_MONEY")} />
            <CategoryTile label="Bank transfer" selected={type === "BANK_TRANSFER"} onPress={() => setType("BANK_TRANSFER")} />
          </View>

          {type === "MOBILE_MONEY" ? (
            <View style={styles.fieldGroup}>
              <TextField label="Account name" value={momoAccountName} onChangeText={setMomoAccountName} autoCapitalize="words" />
              <TextField label="Mobile Money number" value={momoPhone} onChangeText={setMomoPhone} keyboardType="phone-pad" />
              <Text variant="smallMedium" tone="secondary">
                Network
              </Text>
              <View style={styles.categoryRow}>
                {NETWORKS.map((network) => (
                  <CategoryTile key={network} label={network} selected={momoNetwork === network} onPress={() => setMomoNetwork(network)} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.fieldGroup}>
              <TextField label="Account name" value={bankAccountName} onChangeText={setBankAccountName} autoCapitalize="words" />
              <TextField label="Bank name" value={bankName} onChangeText={setBankName} autoCapitalize="words" />
              <TextField label="Account number" value={bankAccountNumber} onChangeText={setBankAccountNumber} keyboardType="number-pad" />
            </View>
          )}

          {update.isError ? (
            <Text variant="small" tone="error">
              {friendlyErrorMessage(update.error)}
            </Text>
          ) : null}
          {update.isSuccess ? (
            <Text variant="small" tone="success">
              Payout destination updated
            </Text>
          ) : null}
          <Button label={update.isPending ? "Saving…" : "Save"} onPress={onSave} disabled={update.isPending} loading={update.isPending} fullWidth style={styles.marginTop} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  section: { padding: Spacing.md, gap: Spacing.sm },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  fieldGroup: { gap: Spacing.sm },
  marginTop: { marginTop: Spacing.sm },
});
