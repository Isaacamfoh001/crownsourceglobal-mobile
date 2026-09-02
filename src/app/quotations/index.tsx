import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { QuotationStatusBadge } from "@/components/ui/QuotationStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useQuotations } from "@/features/quotations/useQuotations";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { QuotationSummaryDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Customer quotations list (M24) — both bulk/instant and custom-sourcing origin quotations, newest first. */
export default function QuotationsScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const feedQuery = useQuotations(status === "SIGNED_IN");

  const rows = useMemo<QuotationSummaryDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text variant="sectionHeading" tone="primary">
        My quotations
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (status === "SIGNED_OUT") {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Sign in required" message="Sign in to see your quotations." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      {header}

      {feedQuery.isPending && !feedQuery.isError ? (
        <View style={styles.loadingBlock}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} height={72} radius={16} />
          ))}
        </View>
      ) : feedQuery.isError ? (
        <ErrorState title="Couldn't load your quotations" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
      ) : (
        <FlatList
          style={styles.flex}
          data={rows}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
          }}
          refreshing={feedQuery.isRefetching && !feedQuery.isFetchingNextPage}
          onRefresh={() => feedQuery.refetch()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No quotations yet" message="Quotations from CrownSourceGlobal will appear here." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/quotations/${item.id}`)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="button">
              <View style={styles.cardHeader}>
                <Text variant="cardTitle" tone="primary" numberOfLines={1} style={styles.cardTitle}>
                  {item.reference}
                </Text>
                <QuotationStatusBadge status={item.status} />
              </View>
              <Text variant="small" tone="secondary">
                {item.currency} {item.total.toFixed(2)} · {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
              </Text>
              <Text variant="small" tone="muted" style={styles.dateLine}>
                Issued {formatDate(item.issuedAt)}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={feedQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  separator: { height: Spacing.sm },
  card: { padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, gap: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  cardTitle: { flex: 1 },
  dateLine: { marginTop: 2 },
  footerLoader: { marginVertical: Spacing.md },
});
