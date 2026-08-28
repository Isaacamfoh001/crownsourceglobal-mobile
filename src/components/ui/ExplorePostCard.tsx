import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Dimensions, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ProviderIdentity } from "./ProviderIdentity";
import { Text } from "./Text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_ASPECT = 4 / 5;
// Matches ExploreScreen's `feed` container's horizontal padding (Spacing.md
// each side) — the card always renders edge-to-edge within it.
const CARD_WIDTH = SCREEN_WIDTH - Spacing.md * 2;

export type ExplorePostCardProps = {
  caption: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  location?: string | null;
  categoryTag?: string | null;
  images: string[];
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onSourceThisLook: () => void;
  onPressProvider?: () => void;
};

/**
 * The visual-discovery post primitive for Explore (M21) — ONE dominant
 * portrait image per row (a swipeable carousel when there are several), a
 * provider header, a short caption, and an interaction row. Distinct from
 * ProductCard on purpose: no price, no MOQ, no vendor-commerce chrome —
 * Explore is inspiration, not a catalogue (AGENTS.md §2/§9, M19.2 §8-12).
 */
export function ExplorePostCard({
  caption,
  providerName,
  providerAvatarUrl,
  location,
  categoryTag,
  images,
  liked,
  saved,
  likeCount,
  onToggleLike,
  onToggleSave,
  onShare,
  onSourceThisLook,
  onPressProvider,
}: ExplorePostCardProps) {
  const { colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const subtitle = [location, categoryTag].filter(Boolean).join(" · ") || null;
  const hasMultipleImages = images.length > 1;

  return (
    <View style={styles.card}>
      <Pressable onPress={onPressProvider} disabled={!onPressProvider} style={styles.header} accessibilityRole={onPressProvider ? "button" : undefined}>
        <ProviderIdentity name={providerName} avatarUrl={providerAvatarUrl} subtitle={subtitle} size={32} />
      </Pressable>

      <View style={styles.imageWrap}>
        {images.length > 0 ? (
          <FlatList
            data={images}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: CARD_WIDTH, height: CARD_WIDTH / IMAGE_ASPECT }} contentFit="cover" transition={150} />
            )}
          />
        ) : (
          <View style={[styles.placeholderContent, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
          </View>
        )}

        {categoryTag ? (
          <View style={styles.tagPill}>
            <Text variant="caption" tone="inverse" numberOfLines={1}>
              {categoryTag.toUpperCase()}
            </Text>
          </View>
        ) : null}

        {hasMultipleImages ? (
          <View style={styles.dots}>
            {images.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={onToggleLike} accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} hitSlop={8} style={styles.actionItem}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? colors.pink : colors.textPrimary} />
          <Text variant="small" tone="secondary">
            {likeCount}
          </Text>
        </Pressable>
        <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" hitSlop={8} style={styles.actionItem}>
          <Ionicons name="paper-plane-outline" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.spacer} />
        <Pressable onPress={onToggleSave} accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved" : "Save"} hitSlop={8}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? colors.pink : colors.textPrimary} />
        </Pressable>
      </View>

      <Text variant="cardTitle" tone="primary" numberOfLines={2} style={styles.caption}>
        {caption}
      </Text>

      <Pressable onPress={onSourceThisLook} style={[styles.sourceCta, { borderColor: colors.borderPremium }]} accessibilityRole="button">
        <Ionicons name="sparkles-outline" size={13} color={colors.gold} />
        <Text variant="smallMedium" tone="gold">
          Source this look
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%" },
  header: { marginBottom: Spacing.xs },
  imageWrap: {
    width: "100%",
    aspectRatio: IMAGE_ASPECT,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  placeholderContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  tagPill: {
    position: "absolute",
    left: Spacing.sm,
    bottom: Spacing.sm,
    backgroundColor: "rgba(20,16,24,0.62)",
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dots: {
    position: "absolute",
    top: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#FFFFFF", width: 14 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginTop: Spacing.xs },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  spacer: { flex: 1 },
  caption: { marginTop: 4 },
  sourceCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
