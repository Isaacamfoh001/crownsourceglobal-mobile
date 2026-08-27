import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ProviderIdentity } from "./ProviderIdentity";
import { Text } from "./Text";

type ExplorePostCardProps = {
  title: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  location?: string | null;
  categoryTag?: string | null;
  /** Real post photography, once the Explore backend domain exists. */
  imageUrl?: string | null;
  /** Dev-fixture-only fallback tile — see src/features/explore/devPostFixtures.ts. Omit once imageUrl is always present. */
  placeholder?: { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string };
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onPress: () => void;
};

/**
 * The visual-discovery post primitive for Explore — ONE dominant portrait
 * image per row (not a grid cell), a provider header, a short caption, and
 * an interaction row. Distinct from ProductCard on purpose: no price, no
 * MOQ, no vendor-commerce chrome — Explore is inspiration, not a catalogue
 * (AGENTS.md §2/§9, M19.2 §8-12).
 */
export function ExplorePostCard({
  title,
  providerName,
  providerAvatarUrl,
  location,
  categoryTag,
  imageUrl,
  placeholder,
  liked,
  saved,
  likeCount,
  onToggleLike,
  onToggleSave,
  onPress,
}: ExplorePostCardProps) {
  const { colors } = useAppTheme();
  const subtitle = [location, categoryTag].filter(Boolean).join(" · ") || null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ProviderIdentity name={providerName} avatarUrl={providerAvatarUrl} subtitle={subtitle} size={32} />
      </View>

      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title} by ${providerName}`}>
        <View style={[styles.imageWrap, placeholder && { backgroundColor: placeholder.bg }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={150} />
          ) : placeholder ? (
            <View style={styles.placeholderContent}>
              <Ionicons name={placeholder.icon} size={44} color={placeholder.fg} />
            </View>
          ) : null}
          {categoryTag ? (
            <View style={styles.tagPill}>
              <Text variant="caption" tone="inverse" numberOfLines={1}>
                {categoryTag.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable onPress={onToggleLike} accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} hitSlop={8} style={styles.actionItem}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? colors.pink : colors.textPrimary} />
          <Text variant="small" tone="secondary">
            {likeCount}
          </Text>
        </Pressable>
        <Pressable onPress={() => {}} accessibilityRole="button" accessibilityLabel="Share" hitSlop={8} style={styles.actionItem}>
          <Ionicons name="paper-plane-outline" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.spacer} />
        <Pressable onPress={onToggleSave} accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved" : "Save"} hitSlop={8}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? colors.pink : colors.textPrimary} />
        </Pressable>
      </View>

      <Text variant="cardTitle" tone="primary" numberOfLines={2} style={styles.caption}>
        {title}
      </Text>
    </View>
  );
}

const IMAGE_ASPECT = 4 / 5;

const styles = StyleSheet.create({
  card: { width: "100%" },
  header: { marginBottom: Spacing.xs },
  imageWrap: {
    width: "100%",
    aspectRatio: IMAGE_ASPECT,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
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
  actionRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginTop: Spacing.xs },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  spacer: { flex: 1 },
  caption: { marginTop: 4 },
});
