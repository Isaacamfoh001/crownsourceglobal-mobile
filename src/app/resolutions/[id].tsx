import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { orderStatus } from "@/lib/orderStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { attachmentImageSource } from "@/lib/media/attachmentImageSource";
import { useResolutionCaseDetail } from "@/features/resolutions/useResolutionCase";
import type { ResolutionCaseDetailDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Read-only resolution-case detail (M26) — what was reported and the real
 * refund/return/replacement outcome. Deliberately no case CREATION or
 * further action here (report-a-problem needs a mobile file-upload form
 * that doesn't exist yet for this milestone — see
 * docs/mobile/MOBILE_V1_PLAN.md's M26 section for the explicit deferral).
 */
export default function ResolutionCaseDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useResolutionCaseDetail(id);
  const caseDetail = query.data;

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text variant="sectionHeading" tone="primary">
          Reported issue
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {query.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={80} radius={Radius.lg} />
          <Skeleton height={140} radius={Radius.lg} style={styles.gap} />
        </View>
      )}

      {query.isError && <ErrorState title="Couldn't load this case" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />}

      {caseDetail && <CaseDetailContent caseDetail={caseDetail} />}
    </SafeAreaView>
  );
}

function CaseDetailContent({ caseDetail }: { caseDetail: ResolutionCaseDetailDTO }) {
  const { colors } = useAppTheme();
  const info = orderStatus.resolutionCase(caseDetail.status);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text variant="cardTitle" tone="primary">
            {caseDetail.caseNumber}
          </Text>
          <Text variant="small" tone="muted">
            Order {caseDetail.orderNumber} · {formatDate(caseDetail.createdAt)}
          </Text>
        </View>
        <StatusBadge label={info.label} tone={info.tone} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="smallMedium" tone="secondary">
          What you reported
        </Text>
        <Text variant="body" tone="primary" style={styles.descriptionText}>
          {caseDetail.customerDescription}
        </Text>
      </View>

      {caseDetail.customerSafeDecisionReason && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="smallMedium" tone="secondary">
            CrownSourceGlobal&apos;s response
          </Text>
          <Text variant="body" tone="primary" style={styles.descriptionText}>
            {caseDetail.customerSafeDecisionReason}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
          AFFECTED ITEMS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {caseDetail.items.map((item, index) => (
            <View key={item.id} style={[styles.itemRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: Spacing.sm }]}>
              <View style={styles.flex}>
                <Text variant="body" tone="primary" numberOfLines={2}>
                  {item.description}
                </Text>
                <Text variant="small" tone="muted">
                  Qty affected {item.quantityAffected} of {item.purchasedQuantity}
                </Text>
                {item.approvedResolution && (
                  <Text variant="small" tone="secondary" style={styles.decisionText}>
                    Outcome: {formatEnum(item.approvedResolution)}
                  </Text>
                )}
              </View>
              {item.approvedRefundAmount && (
                <Text variant="bodyMedium" tone="primary">
                  {formatMoney(item.approvedRefundAmount)}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {caseDetail.refunds.length > 0 && (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            REFUND
          </Text>
          {caseDetail.refunds.map((refund) => (
            <View key={refund.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.refundRow}>
                <Text variant="bodyMedium" tone="primary">
                  {formatMoney(refund.amount)}
                </Text>
                <StatusBadge label={formatEnum(refund.status)} tone={refund.status === "COMPLETED" ? "success" : refund.status === "FAILED" ? "error" : "gold"} />
              </View>
              {refund.processedAt && (
                <Text variant="caption" tone="muted">
                  Processed {formatDate(refund.processedAt)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {caseDetail.replacements.length > 0 && (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            REPLACEMENT
          </Text>
          {caseDetail.replacements.map((r) => (
            <View key={r.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text variant="body" tone="primary">
                Replacement × {r.quantity}
              </Text>
              <Text variant="small" tone="muted">
                {r.replacementFulfilmentId ? "In progress with the vendor" : "Being set up"}
              </Text>
            </View>
          ))}
        </View>
      )}

      {caseDetail.attachments.length > 0 && (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            ATTACHMENTS
          </Text>
          <View style={styles.attachmentGrid}>
            {caseDetail.attachments.map((a) =>
              a.isImage ? (
                <Image key={a.id} source={attachmentImageSource(a.url)} style={[styles.attachmentThumb, { backgroundColor: colors.surfaceSubtle }]} contentFit="cover" />
              ) : (
                <View key={a.id} style={[styles.attachmentThumb, styles.attachmentFile, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
                </View>
              ),
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: TouchTarget },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl, gap: Spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: 4 },
  descriptionText: { marginTop: 4, lineHeight: 20 },
  section: { gap: Spacing.sm },
  sectionLabel: { letterSpacing: 0.5 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm, paddingBottom: Spacing.sm },
  decisionText: { marginTop: 2 },
  refundRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  attachmentGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  attachmentThumb: { width: 72, height: 72, borderRadius: Radius.md },
  attachmentFile: { alignItems: "center", justifyContent: "center" },
});
