import { Fragment, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorConversations, useStartVendorConversation } from "@/features/messaging/useVendorMessages";
import { formatRelativeTime } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { ConversationSummaryDTO } from "@/types/api";

/**
 * Vendor Mode → Messages (M30) — the native counterpart to
 * app/vendor/portal/messages/page.tsx: a "Contact CrownSourceGlobal"
 * composer (mirrors `StartVendorConversationForm`) above the existing
 * conversation list. Vendor↔CrownSource only — never vendor↔customer.
 */
export default function VendorMessagesScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const feedQuery = useVendorConversations(ready);
  const startMutation = useStartVendorConversation();
  const [draft, setDraft] = useState("");

  const rows = useMemo<ConversationSummaryDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  if (!ready) return null;

  function handleStart() {
    const body = draft.trim();
    if (!body || startMutation.isPending) return;
    startMutation.mutate(
      { body },
      {
        onSuccess: (result) => {
          setDraft("");
          router.push(`/vendor-messages/${result.conversationId}`);
        },
      },
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Back" />
        <Text variant="sectionHeading" tone="primary">
          Messages
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <View style={styles.scrollFlex}>
          <View style={[styles.composerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="smallMedium" tone="secondary">
              Contact CrownSourceGlobal
            </Text>
            {startMutation.isError ? (
              <Text variant="small" tone="error">
                {friendlyErrorMessage(startMutation.error)}
              </Text>
            ) : null}
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask us anything about running your store…"
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!startMutation.isPending}
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.bg }]}
            />
            <Button
              label={startMutation.isPending ? "Sending…" : "Send"}
              onPress={handleStart}
              disabled={!draft.trim() || startMutation.isPending}
              style={styles.sendButton}
            />
          </View>

          {feedQuery.isPending && !feedQuery.isError ? (
            <View style={styles.loadingBlock}>
              {[0, 1].map((key) => (
                <Skeleton key={key} height={64} radius={16} />
              ))}
            </View>
          ) : feedQuery.isError ? (
            <ErrorState title="Couldn't load your messages" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState icon="chatbubble-ellipses-outline" title="No conversations yet" message="Conversations with CrownSourceGlobal will show up here." />
          ) : (
            <View style={styles.list}>
              {rows.map((conversation, index) => (
                <Fragment key={conversation.id}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <ConversationRow conversation={conversation} onPress={() => router.push(`/vendor-messages/${conversation.id}`)} />
                </Fragment>
              ))}
              {feedQuery.hasNextPage && (
                <Pressable onPress={() => feedQuery.fetchNextPage()} disabled={feedQuery.isFetchingNextPage} style={styles.loadMore} accessibilityRole="button">
                  <Text variant="smallMedium" tone="pink">
                    {feedQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
          {conversation.status === "OPEN" ? <View style={[styles.statusDot, { backgroundColor: colors.gold }]} /> : null}
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
  scrollFlex: { flex: 1, paddingHorizontal: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 44 },
  composerCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs, marginTop: Spacing.xs },
  input: { minHeight: 44, maxHeight: 100, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: 15 },
  sendButton: { alignSelf: "flex-start" },
  loadingBlock: { marginTop: Spacing.md, gap: Spacing.sm },
  list: { paddingTop: Spacing.sm },
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
