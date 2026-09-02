import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorStoreProfile, useUpdateVendorStoreProfile } from "@/features/vendor/useVendorStore";
import { friendlyErrorMessage } from "@/lib/api/errors";

export default function VendorStoreSettingsScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorStoreProfile(ready);
  const update = useUpdateVendorStoreProfile();

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [pickupAddressLine1, setPickupAddressLine1] = useState("");
  const [pickupContactName, setPickupContactName] = useState("");
  const [pickupContactPhone, setPickupContactPhone] = useState("");

  // Re-sync the form whenever the server hands back a new profile (initial
  // load, or right after a save) — adjusted during render, not an effect,
  // same pattern as FallbackImage.tsx's own doc comment.
  const [syncedProfile, setSyncedProfile] = useState(query.data);
  if (query.data && query.data !== syncedProfile) {
    setSyncedProfile(query.data);
    setCompanyName(query.data.companyName);
    setDescription(query.data.description ?? "");
    setCountry(query.data.country ?? "");
    setRegion(query.data.region ?? "");
    setCity(query.data.city ?? "");
    setContactEmail(query.data.contactEmail ?? "");
    setContactPhone(query.data.contactPhone ?? "");
    setPickupAddressLine1(query.data.pickupAddressLine1 ?? "");
    setPickupContactName(query.data.pickupContactName ?? "");
    setPickupContactPhone(query.data.pickupContactPhone ?? "");
  }

  if (!ready) return null;

  const onSave = () => {
    if (!companyName.trim() || update.isPending) return;
    update.mutate({
      companyName,
      description: description || undefined,
      country: country || undefined,
      region: region || undefined,
      city: city || undefined,
      categorySlugs: query.data?.categorySlugs ?? [],
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      pickupAddressLine1: pickupAddressLine1 || undefined,
      pickupContactName: pickupContactName || undefined,
      pickupContactPhone: pickupContactPhone || undefined,
    });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            Store settings
          </Text>
        </View>

        {query.isPending ? (
          <View style={styles.section}>
            <Skeleton height={160} radius={Radius.lg} />
          </View>
        ) : query.isError ? (
          <ErrorState title="Couldn't load store settings" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : (
          <View style={styles.section}>
            <TextField label="Store name" value={companyName} onChangeText={setCompanyName} />
            <View style={styles.fieldWrap}>
              <Text variant="smallMedium" tone="secondary">
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                placeholderTextColor={colors.textMuted}
                style={[styles.multiline, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
              />
            </View>
            <TextField label="Country" value={country} onChangeText={setCountry} />
            <TextField label="Region" value={region} onChangeText={setRegion} />
            <TextField label="City" value={city} onChangeText={setCity} />
            <TextField label="Contact email" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />
            <TextField label="Contact phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

            <Text variant="sectionHeading" tone="primary" style={styles.sectionHeading}>
              Pickup details
            </Text>
            <Text variant="small" tone="muted">
              Where CrownSourceGlobal collects domestic orders from — never shown to customers.
            </Text>
            <TextField label="Pickup address" value={pickupAddressLine1} onChangeText={setPickupAddressLine1} />
            <TextField label="Pickup contact name" value={pickupContactName} onChangeText={setPickupContactName} autoCapitalize="words" />
            <TextField label="Pickup contact phone" value={pickupContactPhone} onChangeText={setPickupContactPhone} keyboardType="phone-pad" />

            {update.isError ? (
              <Text variant="small" tone="error">
                {friendlyErrorMessage(update.error)}
              </Text>
            ) : null}
            {update.isSuccess ? (
              <Text variant="small" tone="success">
                Store settings updated
              </Text>
            ) : null}
            <Button label={update.isPending ? "Saving…" : "Save"} onPress={onSave} disabled={update.isPending} loading={update.isPending} fullWidth style={styles.marginTop} />
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  section: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  fieldWrap: { gap: Spacing.xxs },
  multiline: { minHeight: 80, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, fontSize: 14, textAlignVertical: "top" },
  sectionHeading: { marginTop: Spacing.md },
  marginTop: { marginTop: Spacing.sm },
});
