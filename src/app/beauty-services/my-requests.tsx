import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { ServiceRequestStatusBadge } from "@/components/ui/ServiceRequestStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useServiceRequests } from "@/features/beauty-services/useServiceRequests";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { ServiceRequestDTO } from "@/types/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Customer request history (M22 §17) — the service-requests analogue of Explore's Saved list. */
export default function MyServiceRequestsScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const feedQuery = useServiceRequests(status === "SIGNED_IN");

  const rows = useMemo<ServiceRequestDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text variant="sectionHeading" tone="primary">
        My service requests
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (status === "SIGNED_OUT") {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Sign in required" message="Sign in to see your service requests." />
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
            <EmptyState icon="sparkles-outline" title="No requests yet" message="Browse Beauty Services and request a professional's service." />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text variant="cardTitle" tone="primary" numberOfLines={1} style={styles.cardTitle}>
                  {item.service.name}
                </Text>
                <ServiceRequestStatusBadge status={item.status} />
              </View>
              <Text variant="small" tone="secondary">
                {item.professional.name}
              </Text>
              <Text variant="small" tone="muted" style={styles.dateLine}>
                Preferred {formatDate(item.preferredDate)}
              </Text>
              {item.status === "PROVIDER_DECLINED" && item.declineReason ? (
                <Text variant="small" tone="error" style={styles.reasonLine}>
                  {item.declineReason}
                </Text>
              ) : null}
            </View>
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
  reasonLine: { marginTop: 4 },
  footerLoader: { marginVertical: Spacing.md },
});
