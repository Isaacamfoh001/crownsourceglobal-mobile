import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useMyExplorePosts } from "@/features/explore/useMyExplorePosts";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { MyExplorePostDTO } from "@/types/api";

function useArchiveExplorePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<{ archived: boolean }>(`/api/v1/explore-posts/${id}/archive`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["explore-mine"] }),
  });
}

function PostRow({ post }: { post: MyExplorePostDTO }) {
  const { colors } = useAppTheme();
  const archive = useArchiveExplorePost();
  const info = vendorStatus.listingApproval(post.approvalStatus);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {post.images[0] ? <Image source={{ uri: post.images[0] }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: colors.surfaceSubtle }]} />}
      <View style={styles.flex}>
        <Text variant="body" tone="primary" numberOfLines={2}>
          {post.caption}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={info.label} tone={info.tone} />
          <Text variant="caption" tone="muted">
            {post.visibility}
          </Text>
        </View>
        {post.changesRequestedReason ? (
          <Text variant="caption" tone="warning">
            {post.changesRequestedReason}
          </Text>
        ) : null}
      </View>
      {post.visibility === "PUBLISHED" ? (
        <Pressable
          onPress={() =>
            Alert.alert("Archive this post?", "It will no longer appear on Explore.", [
              { text: "Cancel", style: "cancel" },
              { text: "Archive", style: "destructive", onPress: () => archive.mutate(post.id) },
            ])
          }
          hitSlop={8}
        >
          <Ionicons name="archive-outline" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** My Explore posts (M27 §17) — reuses the existing M21 mobile architecture (useMyExplorePosts, create.tsx) rather than duplicating it. Edit is deferred — see docs/mobile/MOBILE_V1_PLAN.md. */
export default function VendorExplorePostsScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useMyExplorePosts(ready);
  const rows = query.data?.rows ?? [];

  if (!ready) return null;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          My Explore posts
        </Text>
        <Pressable onPress={() => router.push("/explore/create")} accessibilityRole="button" accessibilityLabel="New post">
          <Ionicons name="add" size={22} color={colors.pink} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {query.isPending ? (
          <Skeleton height={80} radius={Radius.lg} />
        ) : query.isError ? (
          <ErrorState title="Couldn't load your posts" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon="images-outline" title="No posts yet" actionLabel="Share your work" onAction={() => router.push("/explore/create")} />
        ) : (
          rows.map((post) => <PostRow key={post.id} post={post} />)
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  list: { padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.sm },
  thumb: { width: 56, height: 56, borderRadius: Radius.md },
  flex: { flex: 1, gap: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
});
