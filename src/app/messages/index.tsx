import { Fragment, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/features/messaging/useMessages";
import { formatRelativeTime } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { ConversationSummaryDTO } from "@/types/api";

/**
 * Customer Messages inbox (M30) — the native counterpart to
 * app/(customer)/account/messages/page.tsx on web, backed by the same
 * `messagingService` via GET /api/v1/messages. Read-only list + reply
 * only: there is no "start a new conversation" affordance here because
 * the web app doesn't have one either — every conversation begins from a
 * contextual "Ask about this…" entry point (listing/vendor/order/
 * sourcing/case), never a blank compose box (CLAUDE.md §13's no-arbitrary-
 * conversations rule).
 */
export default function MessagesScreen() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const feedQuery = useConversations(status === "SIGNED_IN");

  const rows = useMemo<ConversationSummaryDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  const header = (
    <View style={styles.header}>
      <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Back" />
      <Text variant="sectionHeading" tone="primary">
        Messages
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (status === "SIGNED_OUT") {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Sign in required" message="Sign in to see your messages." actionLabel="Sign in" onAction={() => router.push("/(auth)/sign-in")} />
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
        <ErrorState title="Couldn't load your messages" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="No conversations yet"
          message="When you ask CrownSourceGlobal about an item, order, or request, it'll show up here."
        />
      ) : (
        <View style={styles.list}>
          {rows.map((conversation, index) => (
            <Fragment key={conversation.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <ConversationRow conversation={conversation} onPress={() => router.push(`/messages/${conversation.id}`)} />
            </Fragment>
          ))}
          {feedQuery.hasNextPage && (
            <Pressable
              onPress={() => feedQuery.fetchNextPage()}
              disabled={feedQuery.isFetchingNextPage}
              style={styles.loadMore}
              accessibilityRole="button"
            >
              <Text variant="smallMedium" tone="pink">
                {feedQuery.isFetchingNextPage ? "Loading…" : "Load more"}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function ConversationRow({ conversation, onPress }: { conversation: ConversationSummaryDTO; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSubtle }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodyMedium" tone="primary" numberOfLines={1} style={styles.flex}>
            {conversation.contextLabel}
          </Text>
          {conversation.status === "OPEN" ? (
            <View style={[styles.statusDot, { backgroundColor: colors.gold }]} />
          ) : null}
        </View>
        {conversation.lastMessage ? (
          <Text variant="small" tone="secondary" numberOfLines={1}>
            {conversation.lastMessage}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted" style={styles.timeLine}>
          {formatRelativeTime(conversation.updatedAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 44 },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, paddingVertical: Spacing.sm },
  pressed: { opacity: 0.85 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  timeLine: { marginTop: 2 },
  loadMore: { alignItems: "center", paddingVertical: Spacing.md },
});
