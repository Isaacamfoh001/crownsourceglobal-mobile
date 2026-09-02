import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { SourcingStatusBadge } from "@/components/ui/SourcingStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useSourcingRequests } from "@/features/sourcing/useSourcingRequests";
import { attachmentImageSource } from "@/lib/media/attachmentImageSource";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { SourcingRequestSummaryDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Customer sourcing-request history (M24) — the Source analogue of Beauty Services' "My requests". */
export default function MySourcingRequestsScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const feedQuery = useSourcingRequests(status === "SIGNED_IN");

  const rows = useMemo<SourcingRequestSummaryDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text variant="sectionHeading" tone="primary">
        My sourcing requests
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (status === "SIGNED_OUT") {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Sign in required" message="Sign in to see your sourcing requests." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      {header}

      {feedQuery.isPending && !feedQuery.isError ? (
        <View style={styles.loadingBlock}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} height={78} radius={16} />
          ))}
        </View>
      ) : feedQuery.isError ? (
        <ErrorState title="Couldn't load your requests" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
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
          ListEmptyComponent={
            <EmptyState icon="camera-outline" title="No requests yet" message="Snap a photo of what you're looking for and we'll source it." actionLabel="Start a request" onAction={() => router.push("/(tabs)/source")} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/sourcing/${item.id}`)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
            >
              {item.thumbnail ? (
                <Image source={attachmentImageSource(item.thumbnail)} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="camera-outline" size={20} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text variant="cardTitle" tone="primary" numberOfLines={1} style={styles.cardTitle}>
                    {item.title}
                  </Text>
                  <SourcingStatusBadge status={item.status} label={item.statusLabel} />
                </View>
                <Text variant="small" tone="secondary">
                  {item.requestNumber} · {item.quantity} {item.quantityUnit ?? "units"}
                </Text>
                <Text variant="small" tone="muted" style={styles.dateLine}>
                  Submitted {formatDate(item.submittedAt)}
                </Text>
                {item.hasQuotation ? (
                  <Text variant="small" tone="gold" style={styles.quoteLine}>
                    Quotation ready
                  </Text>
                ) : null}
              </View>
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
  card: { flexDirection: "row", gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: Radius.md },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  cardTitle: { flex: 1 },
  dateLine: { marginTop: 2 },
  quoteLine: { marginTop: 2 },
  footerLoader: { marginVertical: Spacing.md },
});
