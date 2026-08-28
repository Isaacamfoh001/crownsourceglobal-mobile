import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatRelativeTime } from "@/lib/format";
import { ProviderIdentity } from "./ProviderIdentity";
import { Text } from "./Text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_ASPECT = 4 / 5;

export type ExplorePostCardProps = {
  caption: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  location?: string | null;
  categoryTag?: string | null;
  createdAt: string;
  images: string[];
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onSourceThisLook: () => void;
  onPressProvider?: () => void;
  /** Show the compact "Source this look" affordance on this post — the caller decides how often (M22.3 §23: not on every post). */
  showSourceCta?: boolean;
};

/**
 * The visual-discovery post primitive for Explore (M22.3 §16-22) — media is
 * edge-to-edge (no surrounding card border/margin), the provider header and
 * caption own their own horizontal padding instead (see ExploreScreen's
 * `feed`/`listContent`, which deliberately carries no horizontal padding of
 * its own for this reason). Distinct from ProductCard on purpose: no price,
 * no MOQ, no vendor-commerce chrome — Explore is inspiration, not a
 * catalogue (AGENTS.md §2/§9).
 */
export function ExplorePostCard({
  caption,
  providerName,
  providerAvatarUrl,
  location,
  categoryTag,
  createdAt,
  images,
  liked,
  saved,
  likeCount,
  onToggleLike,
  onToggleSave,
  onShare,
  onSourceThisLook,
  onPressProvider,
  showSourceCta = false,
}: ExplorePostCardProps) {
  const { colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const metaLine = [location, categoryTag].filter(Boolean).join("  ·  ") || null;
  const timeLabel = formatRelativeTime(createdAt);

  const [heartScale] = useState(() => new Animated.Value(1));
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!liked) return;
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.3, duration: 110, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 140 }),
    ]).start();
  }, [liked, heartScale]);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPressProvider}
        disabled={!onPressProvider}
        style={styles.header}
        accessibilityRole={onPressProvider ? "button" : undefined}
      >
        <ProviderIdentity name={providerName} avatarUrl={providerAvatarUrl} size={30} />
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
              const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH / IMAGE_ASPECT }} contentFit="cover" transition={150} />
            )}
          />
        ) : (
          <View style={[styles.placeholderContent, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
          </View>
        )}

        {categoryTag ? (
          <LinearGradient colors={["transparent", "rgba(12,9,11,0.55)"]} style={styles.bottomScrim} pointerEvents="none">
            <View style={styles.tagPill}>
              <Text variant="caption" tone="inverse" numberOfLines={1}>
                {categoryTag.toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
        ) : null}

        {hasMultipleImages ? (
          <View style={styles.dots}>
            {images.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.actionRow}>
          <Pressable onPress={onToggleLike} accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} hitSlop={8} style={styles.actionItem}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={23} color={liked ? colors.pink : colors.textPrimary} />
            </Animated.View>
            <Text variant="small" tone="secondary">
              {likeCount}
            </Text>
          </Pressable>
          <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" hitSlop={8} style={styles.actionItem}>
            <Ionicons name="paper-plane-outline" size={21} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.spacer} />
          <Pressable onPress={onToggleSave} accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved" : "Save"} hitSlop={8}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={21} color={saved ? colors.pink : colors.textPrimary} />
          </Pressable>
        </View>

        <Text variant="body" tone="primary" numberOfLines={3} style={styles.caption}>
          <Text variant="bodyMedium" tone="primary">
            {providerName}{" "}
          </Text>
          {caption}
        </Text>

        <View style={styles.metaRow}>
          {metaLine ? (
            <Text variant="small" tone="secondary" numberOfLines={1} style={styles.metaText}>
              {metaLine}
            </Text>
          ) : null}
          {timeLabel ? (
            <Text variant="caption" tone="muted">
              {timeLabel}
            </Text>
          ) : null}
        </View>

        {showSourceCta ? (
          <Pressable onPress={onSourceThisLook} style={[styles.sourceCta, { borderColor: colors.borderPremium }]} accessibilityRole="button">
            <Ionicons name="sparkles-outline" size={13} color={colors.gold} />
            <Text variant="smallMedium" tone="gold">
              Source this look
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%" },
  header: { paddingHorizontal: Spacing.md, marginBottom: Spacing.xs },
  imageWrap: {
    width: "100%",
    aspectRatio: IMAGE_ASPECT,
  },
  placeholderContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  tagPill: {
    alignSelf: "flex-start",
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
  body: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  actionRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  spacer: { flex: 1 },
  caption: { marginTop: Spacing.xs, lineHeight: 19 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3, gap: Spacing.sm },
  metaText: { flexShrink: 1 },
  sourceCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
