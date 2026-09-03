import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorConversationDetail, useVendorReplyToConversation } from "@/features/messaging/useVendorMessages";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { MessageDTO } from "@/types/api";

/** Vendor Mode conversation thread (M30) — the native counterpart to app/vendor/portal/messages/[id]/page.tsx. */
export default function VendorMessageThreadScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useVendorModeGuard();
  const query = useVendorConversationDetail(ready ? id : undefined);
  const replyMutation = useVendorReplyToConversation(id ?? "");
  const [draft, setDraft] = useState("");

  if (!ready) return null;

  function handleSend() {
    const body = draft.trim();
    if (!body || replyMutation.isPending) return;
    replyMutation.mutate(body, { onSuccess: () => setDraft("") });
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Back to messages" />
        <View style={styles.headerTextBlock}>
          <Text variant="sectionHeading" tone="primary" numberOfLines={1}>
            CrownSourceGlobal support
          </Text>
          {query.data ? (
            <Text variant="small" tone="secondary" numberOfLines={1}>
              {query.data.contextLabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {query.isPending ? (
        <View style={styles.loadingBlock}>
          <Skeleton height={56} radius={Radius.lg} />
          <Skeleton height={40} width="70%" radius={Radius.lg} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState title="Couldn't load this conversation" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.thread} showsVerticalScrollIndicator={false}>
            {query.data.messages.length === 0 ? (
              <Text variant="body" tone="muted" style={styles.emptyText}>
                No messages yet.
              </Text>
            ) : (
              query.data.messages.map((message) => <MessageBubble key={message.id} message={message} />)
            )}
          </ScrollView>

          <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
            {replyMutation.isError ? (
              <Text variant="small" tone="error" style={styles.errorText}>
                {friendlyErrorMessage(replyMutation.error)}
              </Text>
            ) : null}
            <View style={styles.composerRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a message…"
                placeholderTextColor={colors.textMuted}
                multiline
                editable={!replyMutation.isPending}
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
              />
              <Button label={replyMutation.isPending ? "Sending…" : "Send"} onPress={handleSend} disabled={!draft.trim() || replyMutation.isPending} style={styles.sendButton} />
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: MessageDTO }) {
  const { colors } = useAppTheme();
  const isStaff = message.senderIsStaff;

  return (
    <View style={[styles.bubbleRow, isStaff ? styles.rowStart : styles.rowEnd]}>
      <View style={[styles.bubble, isStaff ? { backgroundColor: colors.surfaceSubtle } : { backgroundColor: colors.pink }]}>
        <Text variant="body" tone={isStaff ? "primary" : "onAccent"} style={styles.bubbleText}>
          {message.body}
        </Text>
        <Text variant="caption" tone={isStaff ? "muted" : "onAccent"} style={styles.bubbleMeta}>
          {isStaff ? "CrownSourceGlobal" : "You"} ·{" "}
          {new Date(message.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerTextBlock: { flex: 1 },
  headerSpacer: { width: 44 },
  loadingBlock: { padding: Spacing.md, gap: Spacing.sm },
  thread: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  emptyText: { textAlign: "center", paddingVertical: Spacing.xl },
  bubbleRow: { flexDirection: "row" },
  rowStart: { justifyContent: "flex-start" },
  rowEnd: { justifyContent: "flex-end" },
  bubble: { maxWidth: "82%", borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 2 },
  bubbleText: { lineHeight: 20 },
  bubbleMeta: { marginTop: 2, opacity: 0.8 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.md, gap: Spacing.xs },
  errorText: { marginBottom: Spacing.xs },
  composerRow: { flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: 15 },
  sendButton: { flexShrink: 0 },
});
