import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { Text } from "@/components/ui/Text";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useListingDetail } from "@/features/listing/useListingDetail";

/**
 * Product Detail (M22.3 §10-15) — deep recomposition, not a dividers-only
 * patch: media owns the top of the screen edge-to-edge, overlay chrome
 * floats on a dark scrim (legible over any photo regardless of theme), and
 * the info block reads as one coherent commerce block — title, strong
 * price, tappable supplier identity, a compact meta line — rather than a
 * grid of little boxes. Bulk pricing and specs are hairline-separated
 * rows, not a bordered "table" card.
 */
export default function ListingDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isPending, isError, error, refetch } = useListingDetail(id);

  const metaLine = listing
    ? [
        `MOQ ${listing.moq} unit${listing.moq === 1 ? "" : "s"}`,
        listing.maxOq ? `Max ${listing.maxOq}` : null,
        listing.leadTimeDays != null ? `${listing.leadTimeDays}d lead time` : null,
        `${listing.availableQuantity} available`,
      ]
        .filter(Boolean)
        .join("  ·  ")
    : "";

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isPending && !isError && (
          <SafeAreaView edges={["top"]}>
            <Skeleton height={400} radius={0} />
            <View style={styles.loadingBody}>
              <Skeleton height={24} width="80%" />
              <Skeleton height={20} width="40%" style={styles.gap} />
              <Skeleton height={100} style={styles.gap} />
            </View>
          </SafeAreaView>
        )}

        {isError && (
          <SafeAreaView edges={["top"]}>
            <ErrorState title="Couldn't load this product" message={friendlyErrorMessage(error)} onRetry={refetch} />
          </SafeAreaView>
        )}

        {listing && (
          <>
            <ImageGallery images={listing.images} />

            <View style={styles.body}>
              <Text variant="caption" tone="gold" style={styles.eyebrow}>
                {listing.category.name.toUpperCase()}
              </Text>

              <Text variant="screenTitle" tone="primary" numberOfLines={3} style={styles.title}>
                {listing.title}
              </Text>

              <View style={styles.priceRow}>
                <Text variant="priceLarge" tone="pink" numberOfLines={1} style={styles.priceValue}>
                  {formatMoney(listing.price)}
                </Text>
                <AvailabilityBadge status={listing.availabilityStatus} />
              </View>

              <Pressable
                onPress={() => router.push({ pathname: "/vendor/[slug]", params: { slug: listing.vendor.storefrontSlug } })}
                style={[styles.vendorRow, { borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`View ${listing.vendor.companyName}'s storefront`}
              >
                <View style={[styles.vendorAvatar, { backgroundColor: colors.surfaceSubtle }]}>
                  <Text variant="smallMedium" tone="secondary">
                    {listing.vendor.companyName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.vendorTextCol}>
                  <Text variant="bodyMedium" tone="primary" numberOfLines={1}>
                    {listing.vendor.companyName}
                  </Text>
                  <Text variant="small" tone="secondary">
                    Visit storefront
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>

              <Text variant="small" tone="muted" style={styles.metaLine}>
                {metaLine}
              </Text>

              {listing.bulkPriceTiers.length > 0 && (
                <View style={[styles.section, { borderTopColor: colors.border }]}>
                  <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
                    Bulk pricing
                  </Text>
                  <View>
                    {listing.bulkPriceTiers.map((tier, index) => (
                      <View key={tier.id} style={[styles.tierRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                        <Text variant="body" tone="secondary">
                          {tier.maxQuantity ? `${tier.minQuantity}–${tier.maxQuantity} units` : `${tier.minQuantity}+ units`}
                        </Text>
                        <Text variant="bodyMedium" tone="primary">
                          {formatMoney(tier.unitPrice)} / unit
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={[styles.section, { borderTopColor: colors.border }]}>
                <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
                  Description
                </Text>
                <Text variant="body" tone="secondary" style={styles.description}>
                  {listing.description}
                </Text>
              </View>

              {listing.specs && Object.keys(listing.specs).length > 0 && (
                <View style={[styles.section, { borderTopColor: colors.border }]}>
                  <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
                    Specifications
                  </Text>
                  <View>
                    {Object.entries(listing.specs).map(([key, value], index) => (
                      <View key={key} style={[styles.tierRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                        <Text variant="body" tone="secondary" numberOfLines={2} style={styles.specKey}>
                          {key}
                        </Text>
                        <Text variant="bodyMedium" tone="primary" numberOfLines={2} style={styles.specValue}>
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <SafeAreaView edges={["top"]} style={styles.headerOverlay} pointerEvents="box-none">
        <View style={styles.overlayRow}>
          <OverlayButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
          {listing && (
            <OverlayButton
              icon="share-outline"
              onPress={() => {
                Share.share({ message: `${listing.title} — via CrownSourceGlobal` }).catch(() => {});
              }}
              accessibilityLabel="Share this product"
            />
          )}
        </View>
      </SafeAreaView>

      {listing && (
        <SafeAreaView edges={["bottom"]} style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.actionBarInner}>
            <View>
              <Text variant="caption" tone="muted">
                PRICE
              </Text>
              <Text variant="price" tone="pink">
                {formatMoney(listing.price)}
              </Text>
            </View>
            <View style={[styles.disabledCta, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="bag-handle-outline" size={16} color={colors.textMuted} />
              <View>
                <Text variant="bodyMedium" tone="muted">
                  Add to Cart
                </Text>
                <Text variant="caption" tone="muted">
                  Coming soon
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

/** Small overlay icon button — deliberately not the shared IconButton (which uses the app's theme surface color): this floats on top of arbitrary product photography, so it always uses a fixed dark scrim + white icon for guaranteed legibility, independent of light/dark app theme. */
function OverlayButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={8} style={({ pressed }) => [styles.overlayButton, pressed && styles.overlayButtonPressed]}>
      <Ionicons name={icon} size={19} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 112 },
  loadingBody: { padding: Spacing.md, gap: Spacing.sm },
  gap: { marginTop: Spacing.sm },
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  overlayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.sm,
  },
  overlayButton: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: TouchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,16,24,0.42)",
  },
  overlayButtonPressed: { backgroundColor: "rgba(20,16,24,0.6)" },
  body: { padding: Spacing.md, gap: Spacing.xxs },
  eyebrow: { letterSpacing: 0.6 },
  title: { marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm, marginTop: Spacing.sm },
  priceValue: { flexShrink: 1 },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  vendorAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  vendorTextCol: { flex: 1, gap: 1 },
  metaLine: { marginTop: Spacing.sm },
  section: { marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  sectionTitle: { marginBottom: Spacing.xs },
  description: { lineHeight: 22 },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  specKey: { textTransform: "capitalize", flex: 1 },
  specValue: { flex: 1, textAlign: "right" },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  disabledCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
