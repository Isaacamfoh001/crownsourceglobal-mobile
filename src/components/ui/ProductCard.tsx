import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { IconSize, Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import type { ListingSummaryDTO } from "@/types/api";
import { AvailabilityBadge } from "./Badge";
import { Text } from "./Text";

type ProductCardProps = {
  listing: ListingSummaryDTO;
  onPress: () => void;
  width?: number;
};

/** The product-card primitive reused by Home, Shop and the Vendor storefront — one image treatment, one price/title/vendor hierarchy. Explore uses ExplorePostCard instead — a product grid and a visual-discovery feed are different products, not the same card at a different width. */
export function ProductCard({ listing, onPress, width }: ProductCardProps) {
  const { colors, shadow } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatMoney(listing.price)}, sold by ${listing.vendor.companyName}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, ...shadow.card },
        width ? { width } : styles.flexCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.surfaceSubtle }]}>
        {listing.primaryImage ? (
          <Image source={{ uri: listing.primaryImage }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="image-outline" size={IconSize.lg} color={colors.textMuted} />
          </View>
        )}
        {listing.availabilityStatus !== "IN_STOCK" && (
          <View style={styles.badgeOverlay}>
            <AvailabilityBadge status={listing.availabilityStatus} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text variant="small" tone="secondary" numberOfLines={1}>
          {listing.vendor.companyName}
        </Text>
        <Text variant="cardTitle" tone="primary" numberOfLines={2} style={styles.title}>
          {listing.title}
        </Text>
        <View style={styles.priceRow}>
          <Text variant="price" tone="pink" numberOfLines={1} style={styles.priceText}>
            {formatMoney(listing.price)}
          </Text>
          {listing.hasBulkPricing && (
            <Text variant="caption" tone="gold" numberOfLines={1}>
              BULK
            </Text>
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
    overflow: "hidden",
  },
  flexCard: { flex: 1 },
  pressed: { opacity: 0.9 },
  imageWrap: {
    aspectRatio: 1,
  },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  badgeOverlay: { position: "absolute", top: Spacing.xs, left: Spacing.xs },
  body: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs, paddingBottom: Spacing.sm, gap: 1 },
  title: { marginTop: 1 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3, gap: Spacing.xxs },
  priceText: { flexShrink: 1 },
  moq: { marginTop: 1 },
});
