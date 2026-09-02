import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, SectionList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing, IconSize } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/features/notifications/useNotifications";
import { resolveNotificationDestination } from "@/features/notifications/destination";
import { notificationIcon, isToday } from "@/features/notifications/presentation";
import { formatRelativeTime } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { NotificationDTO } from "@/types/api";

/**
 * Native notification inbox (M28) — the mobile counterpart to
 * app/(customer)/account/notifications/page.tsx on web, backed by the same
 * `notificationsService` via GET/POST /api/v1/notifications*. Reads as a
 * consumer activity feed (grouped Today/Earlier, contextual icons, clear
 * unread state), never an admin table.
 */
export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const feedQuery = useNotifications(status === "SIGNED_IN");
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const rows = useMemo<NotificationDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);
  const hasUnread = rows.some((row) => !row.readAt);

  const sections = useMemo(() => {
    const today = rows.filter((row) => isToday(row.createdAt));
    const earlier = rows.filter((row) => !isToday(row.createdAt));
    return [
      ...(today.length ? [{ title: "Today", data: today }] : []),
      ...(earlier.length ? [{ title: "Earlier", data: earlier }] : []),
    ];
  }, [rows]);

  function openNotification(notification: NotificationDTO) {
    if (!notification.readAt) markRead.mutate(notification.id);
    const destination = resolveNotificationDestination(notification.targetUrl);
    if (destination) router.push(destination);
  }

  const header = (
    <View style={styles.header}>
      <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Back" />
      <Text variant="sectionHeading" tone="primary">
        Notifications
      </Text>
      {hasUnread ? (
        <Pressable onPress={() => markAllRead.mutate()} disabled={markAllRead.isPending} accessibilityRole="button" accessibilityLabel="Mark all as read" hitSlop={8}>
          <Text variant="smallMedium" tone="pink">
            Mark all read
          </Text>
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );

  if (status === "SIGNED_OUT") {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Sign in required" message="Sign in to see your notifications." actionLabel="Sign in" onAction={() => router.push("/(auth)/sign-in")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      {header}

      {feedQuery.isPending && !feedQuery.isError ? (
        <View style={styles.loadingBlock}>
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} height={64} radius={16} />
          ))}
        </View>
      ) : feedQuery.isError ? (
        <ErrorState title="Couldn't load your notifications" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
      ) : (
        <SectionList
          style={styles.flex}
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
          }}
          refreshing={feedQuery.isRefetching && !feedQuery.isFetchingNextPage}
          onRefresh={() => feedQuery.refetch()}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              {section.title.toUpperCase()}
            </Text>
          )}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="You're all caught up" message="Updates about your orders, quotes, and requests will show up here." />
          }
          renderItem={({ item }) => <NotificationRow notification={item} onPress={() => openNotification(item)} />}
          ListFooterComponent={feedQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({ notification, onPress }: { notification: NotificationDTO; onPress: () => void }) {
  const { colors } = useAppTheme();
  const unread = !notification.readAt;
  const destination = resolveNotificationDestination(notification.targetUrl);
  const icon = notificationIcon(notification.type);

  return (
    <Pressable
      onPress={onPress}
      disabled={!destination && !unread}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, unread && { backgroundColor: colors.surfaceSubtle }, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: unread ? colors.goldSurface : colors.surface, borderColor: colors.border }]}>
        <Ionicons name={icon} size={IconSize.md} color={unread ? colors.goldStrong : colors.textMuted} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant={unread ? "bodyMedium" : "body"} tone="primary" numberOfLines={1} style={styles.flex}>
            {notification.title}
          </Text>
          {unread && <View style={[styles.dot, { backgroundColor: colors.pink }]} />}
        </View>
        <Text variant="small" tone="secondary" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text variant="caption" tone="muted" style={styles.timeLine}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>

      {destination && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 44 },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  sectionLabel: { paddingTop: Spacing.md, paddingBottom: Spacing.xs, letterSpacing: 0.5 },
  footerLoader: { marginVertical: Spacing.md },
  pressed: { opacity: 0.85 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, borderRadius: Radius.md },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  dot: { width: 7, height: 7, borderRadius: 4 },
  timeLine: { marginTop: 2 },
});
