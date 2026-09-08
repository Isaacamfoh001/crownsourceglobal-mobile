import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useVendorSourcingSolicitations } from "@/features/vendor/useVendorSourcing";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { VendorSolicitationSummaryDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SolicitationRow({ solicitation }: { solicitation: VendorSolicitationSummaryDTO }) {
  const { colors } = useAppTheme();
  const info = vendorStatus.sourcingSolicitation(solicitation.status);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/vendor-sourcing-requests/[id]", params: { id: solicitation.id } })}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowInfo}>
        <Text variant="bodyMedium" tone="primary" numberOfLines={1}>
          {solicitation.requestTitle}
        </Text>
        <Text variant="small" tone="secondary">
          {solicitation.requestReference} · Qty {solicitation.quantity}
          {solicitation.quantityUnit ? ` ${solicitation.quantityUnit}` : ""}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={info.label} tone={info.tone} />
          <Text variant="caption" tone="muted">
            {formatDate(solicitation.sentAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

/** FACTORY-mode primary tab (M32.3 §7) — same solicitation queue/backend data as `vendor-sourcing-requests/index.tsx`, promoted from "More" to a primary tab (that pushed screen stays reachable too, e.g. from a non-Factory-mode "More" hub). */
export default function VendorSourcingTab() {
  const { status } = useAuth();
  const query = useVendorSourcingSolicitations(status === "SIGNED_IN");
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <View style={styles.header}>
        <Text variant="screenTitle" tone="primary">
          Sourcing requests
        </Text>
      </View>

      <View style={styles.list}>
        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={84} radius={Radius.lg} />
            <Skeleton height={84} radius={Radius.lg} />
            <Skeleton height={84} radius={Radius.lg} />
          </View>
        ) : query.isError ? (
          <ErrorState title="Couldn't load sourcing requests" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="globe-outline"
            title="No sourcing requests yet"
            message="When CrownSourceGlobal asks you to quote on a customer's sourcing request, it'll show up here."
          />
        ) : (
          rows.map((solicitation) => <SolicitationRow key={solicitation.id} solicitation={solicitation} />)
        )}
        {query.hasNextPage ? (
          <Pressable onPress={() => query.fetchNextPage()} style={styles.loadMore}>
            <Text variant="small" tone="secondary">
              {query.isFetchingNextPage ? "Loading…" : "Load more"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.md },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  loading: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  rowInfo: { flex: 1, gap: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 2 },
  loadMore: { alignItems: "center", paddingVertical: Spacing.sm },
});
