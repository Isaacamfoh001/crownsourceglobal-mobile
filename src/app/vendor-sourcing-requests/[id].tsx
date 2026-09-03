import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { useVendorSolicitationDetail, useRespondToSolicitation } from "@/features/vendor/useVendorSourcing";
import { vendorStatus } from "@/lib/vendorStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { attachmentImageSource } from "@/lib/media/attachmentImageSource";
import type { VendorSolicitationDetailDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Vendor Mode → Sourcing request detail + response (M29.1). Reuses the
 * existing M25.2 backend/API unchanged — this screen only renders the
 * already-privacy-scoped VendorSolicitationDetailDTO (no customer identity/
 * contact anywhere in it) and calls the existing respond endpoint. The
 * factory's response is deliberately simple: Can fulfil Yes/No, and if
 * Yes, quantity/price/notes only — no worksheet.
 */
export default function VendorSolicitationDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useVendorModeGuard();
  const query = useVendorSolicitationDetail(ready ? id : undefined);

  if (!ready) return null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top"]} scroll={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            Sourcing request
          </Text>
        </View>

        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={200} radius={Radius.lg} />
            <Skeleton height={120} radius={Radius.lg} />
          </View>
        ) : query.isError || !query.data ? (
          <ErrorState title="Couldn't load this request" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : (
          <SolicitationDetailContent detail={query.data} />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function SolicitationDetailContent({ detail }: { detail: VendorSolicitationDetailDTO }) {
  const { colors } = useAppTheme();
  const info = vendorStatus.sourcingSolicitation(detail.status);
  const imageAttachments = detail.attachments.filter((a) => a.isImage);
  const location = [detail.deliveryCity, detail.deliveryRegion, detail.deliveryCountry].filter(Boolean).join(", ");

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {imageAttachments.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {imageAttachments.map((attachment) => (
            <Image
              key={attachment.id}
              source={attachmentImageSource(attachment.url)}
              style={[styles.galleryImage, { backgroundColor: colors.surfaceSubtle }]}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text variant="cardTitle" tone="primary">
            {detail.title}
          </Text>
          <Text variant="small" tone="muted">
            {detail.requestReference} · Sent {formatDate(detail.sentAt)}
          </Text>
        </View>
        <StatusBadge label={info.label} tone={info.tone} />
      </View>

      {detail.description ? (
        <Text variant="body" tone="secondary" style={styles.description}>
          {detail.description}
        </Text>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <FactRow icon="cube-outline" label="Quantity" value={`${detail.quantity}${detail.quantityUnit ? ` ${detail.quantityUnit}` : ""}`} />
        {location ? <FactRow icon="location-outline" label="Delivery" value={location} /> : null}
        {detail.requiredByDate ? <FactRow icon="calendar-outline" label="Needed by" value={formatDate(detail.requiredByDate)} /> : null}
      </View>

      {detail.specifications && Object.keys(detail.specifications).length > 0 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="smallMedium" tone="secondary">
            Specifications
          </Text>
          {Object.entries(detail.specifications).map(([key, value]) => (
            <View key={key} style={styles.specRow}>
              <Text variant="small" tone="muted" style={styles.flex}>
                {key}
              </Text>
              <Text variant="small" tone="primary">
                {value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {detail.status === "SENT" ? (
        <ResponseForm solicitationId={detail.id} />
      ) : (
        <SubmittedResponse detail={detail} />
      )}
    </ScrollView>
  );
}

function FactRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.factRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text variant="small" tone="muted" style={styles.flex}>
        {label}
      </Text>
      <Text variant="smallMedium" tone="primary">
        {value}
      </Text>
    </View>
  );
}

function SubmittedResponse({ detail }: { detail: VendorSolicitationDetailDTO }) {
  const { colors } = useAppTheme();

  if (detail.status === "CANNOT_FULFIL") {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="smallMedium" tone="secondary">
          Your response
        </Text>
        <Text variant="body" tone="primary">
          You told CrownSourceGlobal you can&apos;t fulfil this request.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="smallMedium" tone="secondary">
        Your response
      </Text>
      {detail.response?.proposedQuantity != null ? (
        <FactRow icon="cube-outline" label="You offered" value={`${detail.response.proposedQuantity}${detail.quantityUnit ? ` ${detail.quantityUnit}` : ""}`} />
      ) : null}
      {detail.response?.unitPrice ? <FactRow icon="pricetag-outline" label="Unit price" value={formatMoney(detail.response.unitPrice)} /> : null}
      {detail.response?.leadTimeDays != null ? <FactRow icon="time-outline" label="Lead time" value={`${detail.response.leadTimeDays} days`} /> : null}
      {detail.response?.notes ? (
        <Text variant="small" tone="secondary" style={styles.notesText}>
          {detail.response.notes}
        </Text>
      ) : null}
      {detail.respondedAt ? (
        <Text variant="caption" tone="muted">
          Responded {formatDate(detail.respondedAt)}
        </Text>
      ) : null}
    </View>
  );
}

function ResponseForm({ solicitationId }: { solicitationId: string }) {
  const { colors } = useAppTheme();
  const respond = useRespondToSolicitation();
  const [canFulfil, setCanFulfil] = useState<boolean | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmitYes = quantity.trim().length > 0 && unitPrice.trim().length > 0 && Number(quantity) > 0 && Number(unitPrice) > 0;

  const onSubmit = () => {
    if (canFulfil === null || respond.isPending) return;
    if (canFulfil === false) {
      respond.mutate({ id: solicitationId, canFulfil: false });
      return;
    }
    if (!canSubmitYes) return;
    respond.mutate({
      id: solicitationId,
      canFulfil: true,
      proposedQuantity: Number(quantity),
      unitPrice: Number(unitPrice),
      leadTimeDays: leadTimeDays.trim() ? Number(leadTimeDays) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="smallMedium" tone="secondary">
        Can you fulfil this?
      </Text>
      <View style={styles.choiceRow}>
        <Pressable
          onPress={() => setCanFulfil(true)}
          style={[styles.choiceButton, { borderColor: canFulfil === true ? colors.pink : colors.border, backgroundColor: canFulfil === true ? colors.goldSurface : "transparent" }]}
        >
          <Text variant="bodyMedium" tone={canFulfil === true ? "primary" : "secondary"}>
            Yes
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setCanFulfil(false)}
          style={[styles.choiceButton, { borderColor: canFulfil === false ? colors.pink : colors.border, backgroundColor: canFulfil === false ? colors.goldSurface : "transparent" }]}
        >
          <Text variant="bodyMedium" tone={canFulfil === false ? "primary" : "secondary"}>
            No
          </Text>
        </Pressable>
      </View>

      {canFulfil === true ? (
        <View style={styles.formFields}>
          <TextField label="Available quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="e.g. 5000" />
          <TextField label="Proposed unit price (GHS)" value={unitPrice} onChangeText={setUnitPrice} keyboardType="decimal-pad" placeholder="e.g. 12.50" />
          <TextField label="Lead time in days (optional)" value={leadTimeDays} onChangeText={setLeadTimeDays} keyboardType="number-pad" />
          <TextField label="Note (optional)" value={notes} onChangeText={setNotes} />
        </View>
      ) : null}

      {respond.isError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(respond.error)}
        </Text>
      ) : null}

      <Button
        label={respond.isPending ? "Sending…" : "Send response"}
        onPress={onSubmit}
        disabled={canFulfil === null || (canFulfil === true && !canSubmitYes) || respond.isPending}
        loading={respond.isPending}
        fullWidth
        style={styles.marginTop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  loading: { padding: Spacing.md, gap: Spacing.sm },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  gallery: { marginHorizontal: -Spacing.md },
  galleryImage: { width: 220, height: 220, borderRadius: Radius.lg, marginLeft: Spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  description: { lineHeight: 20 },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.xs },
  factRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  specRow: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.sm },
  notesText: { lineHeight: 19 },
  choiceRow: { flexDirection: "row", gap: Spacing.sm },
  choiceButton: { flex: 1, alignItems: "center", paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 },
  formFields: { gap: Spacing.sm, marginTop: Spacing.xs },
  marginTop: { marginTop: Spacing.xs },
});
