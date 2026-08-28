import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useBeautyProfessionalDetail } from "@/features/beauty-services/useBeautyProfessionalDetail";
import { useCreateServiceRequest } from "@/features/beauty-services/useCreateServiceRequest";
import { friendlyErrorMessage } from "@/lib/api/errors";

const TIME_OPTIONS = ["Morning", "Afternoon", "Evening", "Flexible"] as const;
const MAX_NOTES_LENGTH = 500;

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function dateOffsetDays(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

const DATE_PRESETS = [
  { label: "Tomorrow", date: dateOffsetDays(1) },
  { label: "In 3 days", date: dateOffsetDays(3) },
  { label: "Next week", date: dateOffsetDays(7) },
  { label: "In 2 weeks", date: dateOffsetDays(14) },
];

/**
 * Request Service (M22 §12) — the entire structured booking flow. No
 * payment, no calendar/time-slot engine (prisma/schema.prisma's
 * ServiceRequest doc comment) — a broad date + time preference is enough
 * for CrownSourceGlobal/the provider to coordinate specifics.
 */
export default function RequestServiceScreen() {
  const { colors } = useAppTheme();
  const { professionalId, serviceId: initialServiceId } = useLocalSearchParams<{ professionalId: string; serviceId?: string }>();
  const { status } = useAuth();
  const query = useBeautyProfessionalDetail(professionalId);
  const createMutation = useCreateServiceRequest();

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(initialServiceId);
  const [selectedDate, setSelectedDate] = useState<Date>(DATE_PRESETS[0]!.date);
  const [selectedTime, setSelectedTime] = useState<(typeof TIME_OPTIONS)[number]>("Flexible");
  const [locationMode, setLocationMode] = useState<"PROVIDER_LOCATION" | "CUSTOMER_LOCATION" | undefined>(undefined);
  const [locationDetails, setLocationDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceImage, setReferenceImage] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);

  const professional = query.data;
  const selectedService = useMemo(() => professional?.services.find((s) => s.id === selectedServiceId), [professional, selectedServiceId]);

  const availableLocationModes = useMemo<("PROVIDER_LOCATION" | "CUSTOMER_LOCATION")[]>(() => {
    if (!professional) return [];
    if (professional.locationMode === "BOTH") return ["PROVIDER_LOCATION", "CUSTOMER_LOCATION"];
    return [professional.locationMode];
  }, [professional]);

  const effectiveLocationMode = locationMode ?? (availableLocationModes.length === 1 ? availableLocationModes[0] : undefined);

  if (status === "SIGNED_OUT") {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <EmptyState icon="lock-closed-outline" title="Sign in required" message="Sign in to request a service." />
      </SafeAreaView>
    );
  }

  const pickReferenceImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo library access in Settings to add a reference photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setReferenceImage({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg", fileName: asset.fileName ?? `reference-${Date.now()}.jpg` });
  };

  const canSubmit = Boolean(selectedServiceId) && Boolean(effectiveLocationMode) && !createMutation.isPending;

  const onSubmit = () => {
    if (!canSubmit || !professionalId || !selectedServiceId || !effectiveLocationMode) return;
    createMutation.mutate(
      {
        professionalId,
        serviceId: selectedServiceId,
        preferredDate: selectedDate.toISOString(),
        preferredTimeNote: selectedTime,
        locationMode: effectiveLocationMode,
        locationDetails: locationDetails.trim() || undefined,
        notes: notes.trim() || undefined,
        referenceImage: referenceImage ?? undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Request sent",
            "CrownSourceGlobal has received your request. You'll be notified once the professional responds.",
            [{ text: "OK", onPress: () => router.replace("/beauty-services/my-requests") }],
          );
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            Request Service
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {query.isPending && (
          <View style={styles.loadingBlock}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={44} style={styles.gap} />
          </View>
        )}

        {query.isError && (
          <ErrorState title="Couldn't load this professional" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        )}

        {professional && (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text variant="small" tone="secondary">
              Requesting from
            </Text>
            <Text variant="cardTitle" tone="primary" style={styles.professionalName}>
              {professional.displayName}
            </Text>

            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              Service
            </Text>
            <View style={styles.chipRow}>
              {professional.services.map((service) => (
                <CategoryTile key={service.id} label={service.name} selected={selectedServiceId === service.id} onPress={() => setSelectedServiceId(service.id)} />
              ))}
            </View>
            {selectedService?.startingPrice ? (
              <Text variant="small" tone="gold" style={styles.priceHint}>
                From GH₵ {Number(selectedService.startingPrice.amount).toFixed(0)}
              </Text>
            ) : null}

            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              Preferred date
            </Text>
            <View style={styles.chipRow}>
              {DATE_PRESETS.map((preset) => (
                <CategoryTile
                  key={preset.label}
                  label={preset.label}
                  selected={selectedDate.getTime() === preset.date.getTime()}
                  onPress={() => setSelectedDate(preset.date)}
                />
              ))}
            </View>
            <Text variant="small" tone="muted" style={styles.dateConfirm}>
              {formatDateLabel(selectedDate)}
            </Text>

            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              Preferred time
            </Text>
            <View style={styles.chipRow}>
              {TIME_OPTIONS.map((option) => (
                <CategoryTile key={option} label={option} selected={selectedTime === option} onPress={() => setSelectedTime(option)} />
              ))}
            </View>

            {availableLocationModes.length > 1 ? (
              <>
                <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
                  Where should this happen?
                </Text>
                <View style={styles.chipRow}>
                  {availableLocationModes.map((mode) => (
                    <CategoryTile
                      key={mode}
                      label={mode === "PROVIDER_LOCATION" ? "At their location" : "At my location"}
                      selected={effectiveLocationMode === mode}
                      onPress={() => setLocationMode(mode)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              Location details (optional)
            </Text>
            <TextInput
              value={locationDetails}
              onChangeText={setLocationDetails}
              placeholder="Area, landmark, or address"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            />

            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything the professional should know"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={MAX_NOTES_LENGTH}
              style={[styles.notesInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            />

            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              Reference photo (optional)
            </Text>
            {referenceImage ? (
              <View style={styles.imageThumbWrap}>
                <Image source={{ uri: referenceImage.uri }} style={styles.imageThumb} contentFit="cover" />
                <Pressable onPress={() => setReferenceImage(null)} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.removeButton}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickReferenceImage}
                accessibilityRole="button"
                accessibilityLabel="Add a reference photo"
                style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
              >
                <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
                <Text variant="small" tone="secondary">
                  Add photo
                </Text>
              </Pressable>
            )}

            {createMutation.isError ? (
              <Text variant="small" tone="error" style={styles.errorText}>
                {friendlyErrorMessage(createMutation.error)}
              </Text>
            ) : null}

            <Button
              label={createMutation.isPending ? "Sending…" : "Send request"}
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={createMutation.isPending}
              fullWidth
              style={styles.submitButton}
            />
            <Text variant="small" tone="muted" style={styles.disclaimer}>
              CrownSourceGlobal coordinates every request — no payment is taken now.
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  loadingBlock: { padding: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.xxs },
  professionalName: { marginTop: 2 },
  sectionLabel: { marginTop: Spacing.md, marginBottom: Spacing.xxs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  priceHint: { marginTop: Spacing.xxs },
  dateConfirm: { marginTop: Spacing.xxs },
  textInput: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: 14 },
  notesInput: { minHeight: 80, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, fontSize: 14, textAlignVertical: "top" },
  imageThumbWrap: { position: "relative", width: 84, height: 84 },
  imageThumb: { width: 84, height: 84, borderRadius: Radius.md },
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
  addImageButton: {
    width: 120,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  errorText: { marginTop: Spacing.md },
  submitButton: { marginTop: Spacing.lg },
  disclaimer: { textAlign: "center", marginTop: Spacing.sm },
});
