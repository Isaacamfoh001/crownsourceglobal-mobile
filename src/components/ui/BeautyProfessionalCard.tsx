import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { FallbackImage } from "./FallbackImage";
import { Text } from "./Text";
import type { BeautyProfessionalSummaryDTO } from "@/types/api";

const THUMB_SIZE = 88;

/**
 * Purpose-built Beauty Services discovery card (M22 §9) — deliberately NOT
 * ProductCard (Shop's commerce grid) and NOT ExplorePostCard (Explore's
 * full-bleed visual feed). A compact horizontal row — thumbnail, name,
 * specialties, location, indicative starting price — so a long list of
 * professionals reads like a trusted directory, not a product catalogue.
 * No rating/review/badge/years-of-experience — none of that is real
 * persisted data in M22 (prisma/schema.prisma's section header).
 */
export function BeautyProfessionalCard({ professional, onPress }: { professional: BeautyProfessionalSummaryDTO; onPress: () => void }) {
  const { colors, shadow } = useAppTheme();
  const thumbnailUri = professional.heroImageUrl ?? professional.avatarUrl;
  const specialtyLabel = professional.specialties.slice(0, 2).map((s) => s.name).join(" · ");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={professional.displayName}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, ...shadow.card }, pressed && styles.pressed]}
    >
      <View style={[styles.thumbWrap, { backgroundColor: colors.surfaceSubtle }]}>
        <FallbackImage
          uri={thumbnailUri}
          style={styles.thumb}
          transition={150}
          fallback={
            <View style={styles.thumbFallback}>
              <Text variant="sectionHeading" tone="secondary">
                {professional.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          }
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="cardTitle" tone="primary" numberOfLines={1} style={styles.name}>
            {professional.displayName}
          </Text>
          <View style={[styles.verifiedBadge, { backgroundColor: colors.goldSurface }]}>
            <Ionicons name="shield-checkmark" size={11} color={colors.goldStrong} />
          </View>
        </View>

        {specialtyLabel ? (
          <Text variant="small" tone="secondary" numberOfLines={1}>
            {specialtyLabel}
          </Text>
        ) : null}

        {professional.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text variant="small" tone="muted" numberOfLines={1} style={styles.locationText}>
              {professional.location}
            </Text>
          </View>
        ) : null}

        {professional.fromPrice ? (
          <Text variant="smallMedium" tone="gold" style={styles.price}>
            From GH₵ {Number(professional.fromPrice.amount).toFixed(0)}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
  },
  pressed: { opacity: 0.85 },
  thumbWrap: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Radius.md, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  thumbFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flexShrink: 1 },
  verifiedBadge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 1 },
  locationText: { flexShrink: 1 },
  price: { marginTop: 2 },
});
