import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Share, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { ExplorePostCard } from "@/components/ui/ExplorePostCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useSavedExplorePosts } from "@/features/explore/useSavedExplorePosts";
import { useToggleExploreLike, useToggleExploreSave } from "@/features/explore/useExploreEngagement";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { ExplorePostDTO } from "@/types/api";

/**
 * Saved Explore posts (M21 §10) — a minimal, dedicated list reusing the
 * same feed rendering as the main Explore tab. Reachable only from
 * Explore's header bookmark icon (signed-in only) — deliberately not
 * folded into a larger cross-domain "Saved" area (that's a separate,
 * not-yet-built product-saves feature, out of scope here — see the M21
 * report's "Saved" section).
 */
export default function SavedExplorePostsScreen() {
  const { colors } = useAppTheme();
  const feedQuery = useSavedExplorePosts(true);
  const likeMutation = useToggleExploreLike();
  const saveMutation = useToggleExploreSave();

  const rows = useMemo<ExplorePostDTO[]>(() => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [], [feedQuery.data]);

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text variant="sectionHeading" tone="primary">
        Saved
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      {header}

      {feedQuery.isPending && !feedQuery.isError ? (
        <View style={styles.feed}>
          <Skeleton height={480} radius={16} />
        </View>
      ) : feedQuery.isError ? (
        <ErrorState title="Couldn't load your saved posts" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
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
          ListEmptyComponent={<EmptyState icon="bookmark-outline" title="Nothing saved yet" message="Tap the bookmark icon on a post to save it here." />}
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
              onToggleLike={() => likeMutation.mutate({ postId: item.id, liked: item.engagement.likedByMe })}
              onToggleSave={() => saveMutation.mutate({ postId: item.id, saved: item.engagement.savedByMe })}
              onShare={() => Share.share({ message: `"${item.caption}" by ${item.publisher.name} — via CrownSourceGlobal Explore` }).catch(() => {})}
              onSourceThisLook={() => router.push("/(tabs)/source")}
              onPressProvider={() => router.push({ pathname: "/vendor/[slug]", params: { slug: item.publisher.storefrontSlug } })}
            />
          )}
          ListFooterComponent={feedQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerSpacer: { width: 24 },
  feed: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  separator: { height: Spacing.lg },
  footerLoader: { marginVertical: Spacing.md },
});
