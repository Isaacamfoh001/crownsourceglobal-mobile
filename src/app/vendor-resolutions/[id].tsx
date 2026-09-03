import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorResolutionDetail } from "@/features/vendor/useVendorResolutions";
import { useStartVendorConversation } from "@/features/messaging/useVendorMessages";
import { orderStatus } from "@/lib/orderStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { VendorResolutionCaseDetailDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Vendor Mode → Resolution case detail (M29.1). Same deliberately restricted
 * view as the web Vendor Portal (M9 §46) — only which of the vendor's own
 * items are affected and the case status, never customer identity/contact/
 * description/decision/refund amount. "Message CrownSourceGlobal" (M30) now
 * wires into the real messaging system — `messagingService
 * .startOrContinueVendorContextual` with this case's id as
 * `contextResolutionCaseId` — the exact same call the web Vendor Portal's
 * `startVendorResolutionConversationAction` makes.
 */
export default function VendorResolutionDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useVendorModeGuard();
  const query = useVendorResolutionDetail(ready ? id : undefined);

  if (!ready) return null;

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          Resolution case
        </Text>
      </View>

      {query.isPending ? (
        <View style={styles.loading}>
          <Skeleton height={80} radius={Radius.lg} />
          <Skeleton height={140} radius={Radius.lg} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState title="Couldn't load this case" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <CaseDetailContent detail={query.data} caseId={id} />
      )}
    </Screen>
  );
}

function CaseDetailContent({ detail, caseId }: { detail: VendorResolutionCaseDetailDTO; caseId: string }) {
  const { colors } = useAppTheme();
  const info = orderStatus.resolutionCase(detail.status);
  const startMutation = useStartVendorConversation();
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function handleSend() {
    const body = draft.trim();
    if (!body || startMutation.isPending) return;
    startMutation.mutate(
      { contextResolutionCaseId: caseId, body },
      { onSuccess: (result) => router.push(`/vendor-messages/${result.conversationId}`) },
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text variant="cardTitle" tone="primary">
            {detail.caseNumber}
          </Text>
          <Text variant="small" tone="muted">
            Order {detail.orderNumber} · {formatDate(detail.createdAt)}
          </Text>
        </View>
        <StatusBadge label={info.label} tone={info.tone} />
      </View>

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          AFFECTED ITEM(S)
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {detail.items.map((item, index) => (
            <View key={index} style={[styles.itemRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: Spacing.sm }]}>
              <Text variant="body" tone="primary" style={styles.flex} numberOfLines={2}>
                {item.description}
              </Text>
              <Text variant="body" tone="secondary">
                ×{item.quantityAffected}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="smallMedium" tone="secondary">
          CrownSourceGlobal
        </Text>
        <Text variant="small" tone="muted">
          If CrownSourceGlobal needs information from you about this, it&apos;ll appear here.
        </Text>

        {!composerOpen ? (
          <Pressable onPress={() => setComposerOpen(true)} style={[styles.messageButton, { borderColor: colors.border }]}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
            <Text variant="small" tone="secondary">
              Message CrownSourceGlobal
            </Text>
          </Pressable>
        ) : (
          <View style={styles.composer}>
            {startMutation.isError ? (
              <Text variant="small" tone="error">
                {friendlyErrorMessage(startMutation.error)}
              </Text>
            ) : null}
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask CrownSourceGlobal about this case…"
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!startMutation.isPending}
              style={[styles.composerInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.bg }]}
            />
            <View style={styles.composerActions}>
              <Button label={startMutation.isPending ? "Sending…" : "Send"} onPress={handleSend} disabled={!draft.trim() || startMutation.isPending} style={styles.composerSend} />
              <Pressable onPress={() => setComposerOpen(false)} disabled={startMutation.isPending} accessibilityRole="button">
                <Text variant="smallMedium" tone="muted">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  loading: { padding: Spacing.md, gap: Spacing.sm },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  flex: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionLabel: { letterSpacing: 0.5 },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.xs },
  itemRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm, paddingBottom: Spacing.sm },
  messageButton: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: Spacing.xs, paddingVertical: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  composer: { gap: Spacing.xs, marginTop: Spacing.xs },
  composerInput: { minHeight: 44, maxHeight: 100, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: 15 },
  composerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  composerSend: { alignSelf: "flex-start" },
});
