import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { prepareImage, type PreparedImage } from "@/lib/media/prepareImage";
import { useOrderResolutionContext, useSubmitResolutionCase } from "@/features/resolutions/useReportProblem";
import type { OrderResolutionContextDTO } from "@/types/api";

const MAX_PHOTOS = 3;

const ISSUE_TYPES: { value: string; label: string; hint?: string }[] = [
  { value: "CUSTOMER_CANCELLATION_REQUEST", label: "I want to cancel this", hint: "Only available before delivery" },
  { value: "ITEM_DAMAGED", label: "Item arrived damaged" },
  { value: "WRONG_ITEM", label: "I received the wrong item" },
  { value: "MISSING_ITEM", label: "An item is missing" },
  { value: "MISSING_QUANTITY", label: "I received fewer than I ordered" },
  { value: "ITEM_NOT_AS_DESCRIBED", label: "Item isn't as described" },
  { value: "PACKAGE_NOT_RECEIVED", label: "I never received my package" },
  { value: "DELIVERY_FAILURE", label: "There was a delivery problem" },
  { value: "OTHER", label: "Something else" },
];

/**
 * Customer "Report a problem" (M29.1). The smallest useful mobile version of
 * the web ReportProblemForm: reuses the EXISTING resolutionsService.
 * submitCase + addAttachment via a thin /api/v1/resolutions route — no new
 * resolution type, no client-controlled outcome, no new state machine.
 * Cancellation eligibility is server-computed (getOrderContextForCustomer),
 * never re-derived here.
 */
export default function ReportProblemScreen() {
  const { colors } = useAppTheme();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const query = useOrderResolutionContext(orderId);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.flex, { backgroundColor: colors.bg, paddingTop: Spacing.xl }]}>
        <View style={styles.header}>
          <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
          <Text variant="sectionHeading" tone="primary">
            Report a problem
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={120} radius={Radius.lg} />
            <Skeleton height={160} radius={Radius.lg} style={styles.gap} />
          </View>
        ) : query.isError || !query.data ? (
          <ErrorState title="Couldn't load this order" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : (
          <ReportProblemFormContent context={query.data} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function ReportProblemFormContent({ context }: { context: OrderResolutionContextDTO }) {
  const { colors } = useAppTheme();
  const submit = useSubmitResolutionCase();

  const [issueType, setIssueType] = useState<string>("ITEM_DAMAGED");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PreparedImage[]>([]);

  const isCancellation = issueType === "CUSTOMER_CANCELLATION_REQUEST";
  const relevantFulfilments = isCancellation
    ? context.fulfilments.filter((f) => f.eligibility !== "BLOCKED")
    : context.fulfilments;

  const toggleItem = (orderItemId: string, quantity: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[orderItemId] != null) delete next[orderItemId];
      else next[orderItemId] = quantity;
      return next;
    });
  };

  const setItemQuantity = (orderItemId: string, text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    setSelectedItems((prev) => ({ ...prev, [orderItemId]: digits ? Number(digits) : 0 }));
  };

  const addPhotoFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true, selectionLimit: remaining });
    if (result.canceled || result.assets.length === 0) return;
    const prepared = await Promise.all(result.assets.map((asset) => prepareImage(asset, "resolution-evidence")));
    setPhotos((prev) => [...prev, ...prepared].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const selectedFulfilmentId = isCancellation
    ? relevantFulfilments.find((f) => f.items.some((item) => selectedItems[item.orderItemId] != null))?.fulfilmentId
    : undefined;

  const canSubmit =
    Object.keys(selectedItems).length > 0 &&
    Object.values(selectedItems).every((qty) => qty > 0) &&
    description.trim().length >= 5 &&
    !submit.isPending;

  const onSubmit = () => {
    if (!canSubmit) return;
    submit.mutate(
      {
        orderId: context.orderId,
        issueType,
        description: description.trim(),
        fulfilmentId: selectedFulfilmentId,
        items: Object.entries(selectedItems).map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
        photos,
      },
      {
        onSuccess: (result) => router.replace({ pathname: "/resolutions/[id]", params: { id: result.caseId } }),
      },
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text variant="small" tone="secondary">
        Order {context.orderNumber} · CrownSourceGlobal will review this and get back to you.
      </Text>

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          WHAT WENT WRONG?
        </Text>
        <View style={styles.optionList}>
          {ISSUE_TYPES.map((option) => {
            const selected = issueType === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setIssueType(option.value)}
                style={[styles.optionRow, { borderColor: selected ? colors.pink : colors.border, backgroundColor: selected ? colors.goldSurface : colors.surface }]}
              >
                <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={18} color={selected ? colors.pink : colors.textMuted} />
                <View style={styles.flex}>
                  <Text variant="body" tone="primary">
                    {option.label}
                  </Text>
                  {option.hint ? (
                    <Text variant="caption" tone="muted">
                      {option.hint}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          AFFECTED ITEM(S)
        </Text>
        {relevantFulfilments.map((fulfilment) => (
          <View key={fulfilment.fulfilmentId} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="caption" tone="muted">
              {fulfilment.vendorName}
            </Text>
            {fulfilment.items.map((item) => {
              const checked = selectedItems[item.orderItemId] != null;
              return (
                <View key={item.orderItemId} style={styles.itemRow}>
                  <Pressable onPress={() => toggleItem(item.orderItemId, item.quantity)} style={styles.itemCheckboxRow}>
                    <Ionicons name={checked ? "checkbox" : "square-outline"} size={20} color={checked ? colors.pink : colors.textMuted} />
                    <Text variant="small" tone="primary" style={styles.flex} numberOfLines={2}>
                      {item.description} <Text variant="caption" tone="muted">({formatMoney(item.unitPrice)} each, qty {item.quantity})</Text>
                    </Text>
                  </Pressable>
                  {checked ? (
                    <TextInput
                      value={String(selectedItems[item.orderItemId] ?? "")}
                      onChangeText={(text) => setItemQuantity(item.orderItemId, text)}
                      keyboardType="number-pad"
                      style={[styles.qtyInput, { borderColor: colors.border, color: colors.textPrimary }]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          TELL US WHAT HAPPENED
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Describe the issue in a bit of detail…"
          placeholderTextColor={colors.textMuted}
          style={[styles.textarea, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
        />
      </View>

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          PHOTOS (OPTIONAL)
        </Text>
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
            <Pressable onPress={addPhotoFromLibrary} style={[styles.addPhotoTile, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {submit.isError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(submit.error)}
        </Text>
      ) : null}

      <Button label={submit.isPending ? "Submitting…" : "Submit report"} onPress={onSubmit} disabled={!canSubmit} loading={submit.isPending} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: TouchTarget },
  loading: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl, gap: Spacing.md },
  section: { gap: Spacing.sm },
  sectionLabel: { letterSpacing: 0.5 },
  optionList: { gap: Spacing.xs },
  optionRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.xs },
  itemRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  itemCheckboxRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  qtyInput: { width: 56, borderWidth: 1, borderRadius: Radius.sm, paddingVertical: 6, paddingHorizontal: 8, textAlign: "center", fontSize: 14 },
  textarea: { minHeight: 100, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, fontSize: 14, textAlignVertical: "top" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  photoThumbWrap: { position: "relative" },
  photoThumb: { width: 72, height: 72, borderRadius: Radius.md },
  removeButton: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  addPhotoTile: { width: 72, height: 72, borderRadius: Radius.md, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
});
