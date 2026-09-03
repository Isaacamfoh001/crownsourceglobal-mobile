import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorResolutionDetail } from "@/features/vendor/useVendorResolutions";
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
 * description/decision/refund amount. Messaging is out of scope for this
 * milestone (M30) — the "Message CrownSourceGlobal" concept is preserved as
 * an honest, disabled entry point rather than invented here.
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
        <CaseDetailContent detail={query.data} />
      )}
    </Screen>
  );
}

function CaseDetailContent({ detail }: { detail: VendorResolutionCaseDetailDTO }) {
  const { colors } = useAppTheme();
  const info = orderStatus.resolutionCase(detail.status);

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
        <Pressable
          onPress={() => Alert.alert("Coming soon", "In-app messaging is coming in a future update. For now, CrownSourceGlobal will reach you by email if needed.")}
          style={[styles.messageButton, { borderColor: colors.border }]}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text variant="small" tone="muted">
            Message CrownSourceGlobal (coming soon)
          </Text>
        </Pressable>
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
});
