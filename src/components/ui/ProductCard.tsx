import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import type { ListingSummaryDTO } from "@/types/api";
import { AvailabilityBadge } from "./Badge";
import { FallbackImage } from "./FallbackImage";
import { Text } from "./Text";

type ProductCardProps = {
  listing: ListingSummaryDTO;
  onPress: () => void;
  width?: number;
};

/**
 * The product-card primitive reused by Home, Shop and the Vendor storefront
 * (M22.3 §7-9) — a tall 4:5 merchandise image dominates the card, with a
 * brand-line/title/price hierarchy below rather than a database-record
 * layout. Explore uses ExplorePostCard instead — a product grid and a
 * visual-discovery feed are different products, not the same card at a
 * different width.
 */
export function ProductCard({ listing, onPress, width }: ProductCardProps) {
  const { colors, shadow } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatMoney(listing.price)}, sold by ${listing.vendor.companyName}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, ...shadow.card },
        width ? { width } : styles.flexCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.surfaceSubtle }]}>
        <FallbackImage
          uri={listing.primaryImage}
          style={styles.image}
          contentFit="cover"
          transition={150}
          fallback={
            <View style={styles.imageFallback}>
              <View style={[styles.fallbackBadge, { backgroundColor: colors.surface }]}>
                <Ionicons name="sparkles-outline" size={18} color={colors.gold} />
              </View>
              <Text variant="caption" tone="muted" numberOfLines={1} style={styles.fallbackLabel}>
                {listing.category.name}
              </Text>
            </View>
          }
        />
        {listing.availabilityStatus !== "IN_STOCK" && (
          <View style={styles.badgeOverlay}>
            <AvailabilityBadge status={listing.availabilityStatus} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.vendor}>
          {listing.vendor.companyName.toUpperCase()}
        </Text>
        <Text variant="cardTitle" tone="primary" numberOfLines={2} style={styles.title}>
          {listing.title}
        </Text>
        <View style={styles.priceRow}>
          <Text variant="price" tone="pink" numberOfLines={1} style={styles.priceText}>
            {formatMoney(listing.price)}
          </Text>
          {listing.hasBulkPricing && (
            <View style={[styles.bulkChip, { backgroundColor: colors.goldSurface }]}>
              <Text variant="caption" tone="gold" numberOfLines={1}>
                BULK
              </Text>
            </View>
          )}
        </View>
        {listing.moq > 1 && (
          <Text variant="small" tone="muted" numberOfLines={1} style={styles.moq}>
            MOQ {listing.moq}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const CARD_RADIUS = Radius.md;

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  flexCard: { flex: 1 },
  pressed: { opacity: 0.9 },
  imageWrap: {
    aspectRatio: 4 / 5,
  },
  image: { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: Spacing.sm },
  fallbackBadge: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  fallbackLabel: { textAlign: "center" },
  badgeOverlay: { position: "absolute", top: Spacing.xs, left: Spacing.xs },
  body: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs, paddingBottom: Spacing.sm, gap: 1 },
  vendor: { letterSpacing: 0.4 },
  title: { marginTop: 1 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 3, gap: Spacing.xxs },
  priceText: { flexShrink: 1 },
  bulkChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  moq: { marginTop: 1 },
});
