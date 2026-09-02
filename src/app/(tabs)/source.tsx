import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { PickerModal } from "@/components/ui/PickerModal";
import { Radius, Spacing } from "@/constants/theme";
import { COUNTRIES } from "@/constants/countries";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { promptSignInRequired } from "@/lib/auth/requireAuthPrompt";
import { prepareImage, type PreparedImage } from "@/lib/media/prepareImage";
import { useCreateSourcingRequest } from "@/features/sourcing/useCreateSourcingRequest";
import { friendlyErrorMessage } from "@/lib/api/errors";

const MAX_PHOTOS = 5;
const MAX_DESCRIPTION_LENGTH = 1000;
/** 7 digits = up to 9,999,999 — generous for any realistic bulk order, and short enough that the field never needs to grow past a fixed width on a 320pt screen. */
const MAX_QUANTITY_DIGITS = 7;

/**
 * Source (M24) — the real photo-first sourcing request flow, replacing the
 * "coming soon" placeholder. Stays visible and fully fillable while signed
 * out (CLAUDE.md §10/§20: "do not force authentication just to open
 * Source"); sign-in is only required at Submit, and — because this is a
 * tab screen rather than a pushed route — the filled-in form simply stays
 * mounted underneath the sign-in screen and is still here when the user
 * comes back, which is all the "preserve the draft" requirement needs
 * (no server-side draft mechanism, per the brief's explicit instruction
 * not to build one).
 */
export default function SourceScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const createMutation = useCreateSourcingRequest();

  const [photos, setPhotos] = useState<PreparedImage[]>([]);
  const [description, setDescription] = useState("");
  // Raw text, not a number: a customer sourcing 10,000+ units shouldn't
  // have to tap a +/- stepper that many times (physical-device feedback),
  // and a plain numeric TextInput needs to tolerate an empty string while
  // the user is clearing/retyping — see MAX_QUANTITY_DIGITS below.
  const [quantityText, setQuantityText] = useState("1");
  const [country, setCountry] = useState("Ghana");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");

  const quantity = parseInt(quantityText, 10);
  const hasValidQuantity = Number.isInteger(quantity) && quantity > 0;
  const hasPhoto = photos.length > 0;
  const hasDescription = description.trim().length > 0;
  const canSubmit = (hasPhoto || hasDescription) && hasValidQuantity && country.trim().length > 0 && !createMutation.isPending;

  function handleQuantityChange(text: string) {
    // Digits only — never lets a stray letter/decimal point/minus sign in,
    // but still lets the field go fully empty while the user is retyping
    // (never forces a permanent "0" they can't clear).
    setQuantityText(text.replace(/[^0-9]/g, "").slice(0, MAX_QUANTITY_DIGITS));
  }

  async function addPhotoFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access in Settings to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const prepared = await prepareImage(result.assets[0], "sourcing");
    setPhotos((prev) => [...prev, prepared].slice(0, MAX_PHOTOS));
  }

  async function addPhotoFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo library access in Settings to add a photo.");
      return;
    }
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true, selectionLimit: remaining });
    if (result.canceled || result.assets.length === 0) return;
    const prepared = await Promise.all(result.assets.map((asset) => prepareImage(asset, "sourcing")));
    setPhotos((prev) => [...prev, ...prepared].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit() {
    if (!canSubmit) return;
    if (status === "SIGNED_OUT") {
      promptSignInRequired("submit your sourcing request", "/(tabs)/source");
      return;
    }

    createMutation.mutate(
      {
        description: description.trim(),
        quantity,
        deliveryCountry: country,
        deliveryRegion: region.trim() || undefined,
        deliveryCity: city.trim() || undefined,
        photos,
      },
      {
        onSuccess: (data) => {
          Alert.alert(
            "Request received",
            "CrownSourceGlobal will review your request and reach out through the app if we need more information.",
            [{ text: "OK", onPress: () => router.push(`/sourcing/${data.id}`) }],
          );
          setPhotos([]);
          setDescription("");
          setQuantityText("1");
          setRegion("");
          setCity("");
        },
      },
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen scroll={false} contentStyle={styles.screenContent}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.topRow}>
            <View style={styles.topRowSpacer} />
            {status === "SIGNED_IN" ? (
              <IconButton name="time-outline" accessibilityLabel="My sourcing requests" onPress={() => router.push("/sourcing/my-requests")} />
            ) : (
              <View style={styles.topRowSpacer} />
            )}
          </View>
          <View style={styles.header}>
            <Text variant="smallMedium" tone="gold" style={styles.eyebrow}>
              SOURCE
            </Text>
            <Text variant="screenTitle" tone="primary">
              Find anything
            </Text>
            <Text variant="body" tone="secondary" style={styles.subtitle}>
              Show us what you&apos;re looking for and CrownSourceGlobal will source it for you.
            </Text>
          </View>

          {/* Photos */}
          <View style={styles.photoRow}>
            {photos.map((photo, index) => (
              <View key={photo.uri} style={styles.photoThumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} contentFit="cover" />
                <Pressable onPress={() => removePhoto(index)} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.removeButton}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              hasPhoto ? (
                <Pressable onPress={addPhotoFromLibrary} style={[styles.addPhotoTile, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]} accessibilityRole="button" accessibilityLabel="Add another photo">
                  <Ionicons name="add" size={22} color={colors.textSecondary} />
                </Pressable>
              ) : null
            ) : null}
          </View>

          {!hasPhoto ? (
            <View style={[styles.captureCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderPremium }]}>
              <View style={[styles.captureIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="camera" size={26} color={colors.gold} />
              </View>
              <Text variant="bodyMedium" tone="secondary">
                A photo helps us find the exact item
              </Text>
              <View style={styles.captureActions}>
                <Button label="Take Photo" variant="outline" onPress={addPhotoFromCamera} style={styles.captureButton} />
                <Button label="Upload Photo" variant="outline" onPress={addPhotoFromLibrary} style={styles.captureButton} />
              </View>
            </View>
          ) : null}

          {/* Description */}
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            {hasPhoto ? "Describe what you need (optional)" : "Describe what you need"}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. 500 branded tote bags, navy canvas with white logo"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={MAX_DESCRIPTION_LENGTH}
            style={[styles.notesInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />

          {/* Quantity — a plain numeric field, not a +/- stepper: sourcing
              requests routinely run into the thousands, and no one should
              have to tap a button that many times (physical-device
              feedback). */}
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            Quantity
          </Text>
          <TextInput
            value={quantityText}
            onChangeText={handleQuantityChange}
            keyboardType="number-pad"
            placeholder="e.g. 500"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_QUANTITY_DIGITS}
            accessibilityLabel="Quantity"
            style={[styles.quantityInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          {quantityText.length > 0 && hasValidQuantity ? (
            <Text variant="small" tone="muted" style={styles.quantityHint}>
              {quantity.toLocaleString()} unit{quantity === 1 ? "" : "s"}
            </Text>
          ) : null}

          {/* Delivery location */}
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            Delivery location
          </Text>
          <Pressable onPress={() => setCountryPickerOpen(true)} style={[styles.selectRow, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityRole="button">
            <Text variant="body" tone="primary">
              {country || "Choose a country"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>
          <View style={styles.locationRow}>
            <TextInput
              value={region}
              onChangeText={setRegion}
              placeholder="Region (optional)"
              placeholderTextColor={colors.textMuted}
              style={[styles.locationInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City (optional)"
              placeholderTextColor={colors.textMuted}
              style={[styles.locationInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            />
          </View>

          {createMutation.isError ? (
            <Text variant="small" tone="error" style={styles.errorText}>
              {friendlyErrorMessage(createMutation.error)}
            </Text>
          ) : null}

          <Button
            label={createMutation.isPending ? "Submitting…" : "Submit sourcing request"}
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={createMutation.isPending}
            fullWidth
            style={styles.submitButton}
          />
          <Text variant="small" tone="muted" style={styles.disclaimer}>
            CrownSourceGlobal reviews every request and follows up in the app — no vendor ever contacts you directly.
          </Text>
        </ScrollView>

        <PickerModal
          visible={countryPickerOpen}
          title="Destination country"
          options={COUNTRIES}
          selected={country}
          onSelect={setCountry}
          onClose={() => setCountryPickerOpen(false)}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { flex: 1, paddingHorizontal: 0, paddingTop: 0 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topRowSpacer: { width: 44, height: 44 },
  header: { alignItems: "center", gap: 2, marginBottom: Spacing.lg },
  eyebrow: { letterSpacing: 1.2 },
  subtitle: { textAlign: "center", marginTop: Spacing.xxs },
  captureCard: {
    alignSelf: "stretch",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  captureIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  captureActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs, alignSelf: "stretch" },
  captureButton: { flex: 1 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.sm },
  photoThumbWrap: { position: "relative", width: 84, height: 84 },
  photoThumb: { width: 84, height: 84, borderRadius: Radius.md },
  addPhotoTile: { width: 84, height: 84, borderRadius: Radius.md, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(20,16,24,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: { marginTop: Spacing.lg, marginBottom: Spacing.xxs },
  notesInput: { minHeight: 90, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, fontSize: 15, textAlignVertical: "top" },
  quantityInput: { minHeight: 48, width: 140, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: 15 },
  quantityHint: { marginTop: Spacing.xxs },
  selectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm },
  locationRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  locationInput: { flex: 1, minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: 15 },
  errorText: { marginTop: Spacing.md },
  submitButton: { marginTop: Spacing.xl },
  disclaimer: { textAlign: "center", marginTop: Spacing.sm },
});
