import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Share, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { ExplorePostCard } from "@/components/ui/ExplorePostCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { IconSize, Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useExploreFeed } from "@/features/explore/useExploreFeed";
import { useToggleExploreLike, useToggleExploreSave } from "@/features/explore/useExploreEngagement";
import { promptSignInRequired } from "@/lib/auth/requireAuthPrompt";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { isEligibleExploreProvider } from "@/features/explore/eligibility";
import type { ExplorePostDTO } from "@/types/api";

/**
 * Explore (M21) — a real, backend-backed beauty-work discovery feed
 * replacing M19's development fixtures. Single-column, image-dominant,
 * Instagram-inspired (AGENTS.md §2/§9, M19.2 §8-12) — see
 * ExplorePostCard.tsx for the per-post visual language, which is
 * unchanged from M19.2's approved design beyond adding real
 * multi-image carousel support.
 */
export default function ExploreScreen() {
  const { colors } = useAppTheme();
  const { status, me } = useAuth();
  const isSignedIn = status === "SIGNED_IN";
  const canPost = isEligibleExploreProvider(me);

  const feedQuery = useExploreFeed();
  const likeMutation = useToggleExploreLike();
  const saveMutation = useToggleExploreSave();

  const rows = useMemo<ExplorePostDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  const onToggleLike = (post: ExplorePostDTO) => {
    if (!isSignedIn) {
      promptSignInRequired("like posts", "/(tabs)/explore");
      return;
    }
    likeMutation.mutate({ postId: post.id, liked: post.engagement.likedByMe });
  };

  const onToggleSave = (post: ExplorePostDTO) => {
    if (!isSignedIn) {
      promptSignInRequired("save posts", "/(tabs)/explore");
      return;
    }
    saveMutation.mutate({ postId: post.id, saved: post.engagement.savedByMe });
  };

  const onShare = async (post: ExplorePostDTO) => {
    try {
      // No public web Explore detail route exists yet (M21 §11) — sharing
      // caption/provider context is the honest, non-broken option for V1;
      // a deep/universal link is a documented future improvement.
      await Share.share({ message: `"${post.caption}" by ${post.publisher.name} — via CrownSourceGlobal Explore` });
    } catch {
      // User cancelled the share sheet — nothing to do.
    }
  };

  const onSourceThisLook = () => {
    // Native sourcing creation isn't wired up yet (Source tab is a value-
    // prop placeholder — see src/app/(tabs)/source.tsx) — navigate there
    // rather than fake an integration. See the M21 report's "Source from
    // this look" section for the follow-up task.
    router.push("/(tabs)/source");
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text variant="screenTitle" tone="primary">
          Explore
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/(tabs)/source")}
            accessibilityRole="button"
            accessibilityLabel="Source a look from a photo"
            hitSlop={6}
            style={styles.headerIconButton}
          >
            <Ionicons name="camera-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => {
              if (!isSignedIn) {
                promptSignInRequired("view saved posts", "/(tabs)/explore");
                return;
              }
              router.push("/explore/saved");
            }}
            accessibilityRole="button"
            accessibilityLabel="Saved posts"
            hitSlop={6}
            style={styles.headerIconButton}
          >
            <Ionicons name="bookmark-outline" size={20} color={colors.textPrimary} />
          </Pressable>
          {canPost ? (
            <Pressable
              onPress={() => router.push("/explore/create")}
              accessibilityRole="button"
              accessibilityLabel="Share your work"
              hitSlop={6}
              style={[styles.headerIconButton, { backgroundColor: colors.pinkSurface }]}
            >
              <Ionicons name="add" size={20} color={colors.pink} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (feedQuery.isPending && !feedQuery.isError) {
    return (
      <Screen contentStyle={styles.content}>
        {header}
        <View style={styles.feed}>
          <Skeleton height={480} radius={16} />
          <Skeleton height={480} radius={16} style={styles.skeletonGap} />
        </View>
      </Screen>
    );
  }

  if (feedQuery.isError) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        {header}
        <ErrorState title="Couldn't load Explore" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <FlatList
        style={styles.flex}
        data={rows}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
        }}
        refreshing={feedQuery.isRefetching && !feedQuery.isFetchingNextPage}
        onRefresh={() => feedQuery.refetch()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={IconSize.xl} color={colors.textMuted} />
            <Text variant="sectionHeading" tone="primary" style={styles.emptyTitle}>
              Fresh inspiration is coming
            </Text>
            <Text variant="body" tone="secondary" style={styles.emptyMessage}>
              Beauty professionals&apos; latest work will appear here.
            </Text>
            {canPost ? (
              <Button label="Share your work" onPress={() => router.push("/explore/create")} style={styles.emptyButton} />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ExplorePostCard
            caption={item.caption}
            providerName={item.publisher.name}
            providerAvatarUrl={item.publisher.avatarUrl}
            location={item.location}
            categoryTag={item.category.name}
            images={item.images}
            liked={item.engagement.likedByMe}
            saved={item.engagement.savedByMe}
            likeCount={item.engagement.likeCount}
            onToggleLike={() => onToggleLike(item)}
            onToggleSave={() => onToggleSave(item)}
            onShare={() => onShare(item)}
            onSourceThisLook={onSourceThisLook}
            onPressProvider={() => router.push({ pathname: "/vendor/[slug]", params: { slug: item.publisher.storefrontSlug } })}
          />
        )}
        ListFooterComponent={feedQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: Spacing.xxl },
  listContent: { paddingBottom: Spacing.xxl + Spacing.lg },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  feed: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  skeletonGap: { marginTop: Spacing.lg },
  separator: { height: Spacing.lg },
  empty: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.xs },
  emptyTitle: { textAlign: "center", marginTop: Spacing.xs },
  emptyMessage: { textAlign: "center" },
  emptyButton: { marginTop: Spacing.sm },
  footerLoader: { marginVertical: Spacing.md },
});
