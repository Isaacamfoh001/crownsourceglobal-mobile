import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Color, Radius, Shadow, Spacing } from "@/constants/theme";
import { formatMoney } from "@/lib/format";
import type { ListingSummaryDTO } from "@/types/api";
import { AvailabilityBadge } from "./Badge";
import { Text } from "./Text";

type ProductCardProps = {
  listing: ListingSummaryDTO;
  onPress: () => void;
  width?: number;
};

/** The product-card primitive reused by Home, Explore, Shop and the Vendor storefront — one image treatment, one price/title/vendor hierarchy. */
export function ProductCard({ listing, onPress, width }: ProductCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatMoney(listing.price)}, sold by ${listing.vendor.companyName}`}
      style={({ pressed }) => [styles.card, width ? { width } : styles.flexCard, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {listing.primaryImage ? (
          <Image source={{ uri: listing.primaryImage }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text variant="small" tone="onLightFaint">
              No image
            </Text>
          </View>
        )}
        {listing.availabilityStatus !== "IN_STOCK" && (
          <View style={styles.badgeOverlay}>
            <AvailabilityBadge status={listing.availabilityStatus} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text variant="small" tone="onLightMuted" numberOfLines={1}>
          {listing.vendor.companyName}
        </Text>
        <Text variant="bodyMedium" tone="onLight" numberOfLines={2} style={styles.title}>
          {listing.title}
        </Text>
        <View style={styles.priceRow}>
          <Text variant="bodyMedium" tone="pink">
            {formatMoney(listing.price)}
          </Text>
          {listing.hasBulkPricing && (
            <Text variant="caption" tone="goldOnLight">
              BULK PRICING
            </Text>
          )}
        </View>
        {listing.moq > 1 && (
          <Text variant="small" tone="onLightFaint">
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
    backgroundColor: Color.commerce.surface,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Color.commerce.border,
    ...Shadow.card,
  },
  flexCard: { flex: 1 },
  pressed: { opacity: 0.9 },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: Color.commerce.surfaceSubtle,
  },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  badgeOverlay: { position: "absolute", top: Spacing.xs, left: Spacing.xs },
  body: { padding: Spacing.sm, gap: 2 },
  title: { minHeight: 40 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
});
