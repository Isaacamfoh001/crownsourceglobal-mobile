import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ExplorePostCard } from "@/components/ui/ExplorePostCard";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { DEV_EXPLORE_POST_FIXTURES, DEV_TINT_STYLE } from "@/features/explore/devPostFixtures";

/**
 * Explore (M19.2 §8-12): a single-column, Instagram/Pinterest-style visual
 * discovery feed of beauty professionals' work — ONE dominant portrait post
 * per row, not a product grid (that's Shop's job). There is no live
 * Explore/portfolio-post backend yet, so this screen renders clearly-
 * labelled development fixtures (see devPostFixtures.ts). Like/save are
 * local component state only — see the toggle handlers below and the
 * fixtures file header for exactly what is and isn't persisted.
 */
export default function ExploreScreen() {
  const { colors } = useAppTheme();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="screenTitle" tone="primary">
          Explore
        </Text>
        <Text variant="body" tone="secondary" style={styles.subtitle}>
          Real work from stylists, salons and MUAs — hairstyles, braids, makeup, lashes and nails.
        </Text>
      </View>

      <Pressable onPress={() => router.push("/(tabs)/source")} style={[styles.sourceCta, { backgroundColor: colors.pinkSurface }]} accessibilityRole="button">
        <Ionicons name="camera" size={16} color={colors.pink} />
        <Text variant="smallMedium" tone="pink" style={styles.sourceCtaText}>
          Saw a look you love? Source it from a photo
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.pink} />
      </Pressable>

      <View style={[styles.devBanner, { backgroundColor: colors.warningSurface }]}>
        <Ionicons name="construct-outline" size={13} color={colors.warning} />
        <Text variant="caption" tone="warning" style={styles.devBannerText}>
          PREVIEW LAYOUT — SAMPLE CONTENT, NOT LIVE POSTS
        </Text>
      </View>

      <View style={styles.feed}>
        {DEV_EXPLORE_POST_FIXTURES.map((post) => {
          const liked = likedIds.has(post.id);
          const baseCount = post.sampleLikeCount + (liked ? 1 : 0);
          return (
            <ExplorePostCard
              key={post.id}
              title={post.title}
              providerName={post.providerName}
              location={post.location}
              categoryTag={post.categoryTag}
              placeholder={{ icon: post.placeholderIcon, bg: DEV_TINT_STYLE[post.placeholderTint].bg, fg: DEV_TINT_STYLE[post.placeholderTint].fg }}
              liked={liked}
              saved={savedIds.has(post.id)}
              likeCount={baseCount}
              onToggleLike={() => toggleLike(post.id)}
              onToggleSave={() => toggleSave(post.id)}
              onPress={() => {}}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, gap: 3 },
  subtitle: { marginTop: 2 },
  sourceCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  sourceCtaText: { flex: 1 },
  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  devBannerText: { flex: 1 },
  feed: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.lg },
});
