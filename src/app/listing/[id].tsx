import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { Text } from "@/components/ui/Text";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useListingDetail } from "@/features/listing/useListingDetail";

/**
 * Product Detail (M19.2 §18): image first, one flowing information column —
 * not a separate bordered card for every fact. Only bulk pricing and
 * specs get a bordered list (they're tabular data, not prose), everything
 * else is plain vertical rhythm.
 */
export default function ListingDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isPending, isError, error, refetch } = useListingDetail(id);

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
              <Pressable
                onPress={() => router.push({ pathname: "/vendor/[slug]", params: { slug: listing.vendor.storefrontSlug } })}
                style={styles.vendorRow}
                accessibilityRole="button"
                accessibilityLabel={`View ${listing.vendor.companyName}'s storefront`}
              >
                <Text variant="smallMedium" tone="secondary" numberOfLines={1} style={styles.vendorRowText}>
                  {listing.vendor.companyName}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </Pressable>

              <Text variant="screenTitle" tone="primary" numberOfLines={3} style={styles.title}>
                {listing.title}
              </Text>

              <View style={styles.priceRow}>
                <Text variant="priceLarge" tone="pink" numberOfLines={1} style={styles.priceValue}>
                  {formatMoney(listing.price)}
                </Text>
                <AvailabilityBadge status={listing.availabilityStatus} />
              </View>

              <View style={styles.metaGrid}>
                <MetaItem label="MOQ" value={`${listing.moq} unit${listing.moq === 1 ? "" : "s"}`} />
                {listing.maxOq && <MetaItem label="Max order" value={`${listing.maxOq} units`} />}
                {listing.leadTimeDays != null && <MetaItem label="Lead time" value={`${listing.leadTimeDays} day${listing.leadTimeDays === 1 ? "" : "s"}`} />}
                <MetaItem label="Available" value={`${listing.availableQuantity} units`} />
                <MetaItem label="Category" value={listing.category.name} />
              </View>

              {listing.bulkPriceTiers.length > 0 && (
                <View style={[styles.section, { borderTopColor: colors.border }]}>
                  <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
                    Bulk pricing
                  </Text>
                  <View style={[styles.tiersCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {listing.bulkPriceTiers.map((tier) => (
                      <View key={tier.id} style={[styles.tierRow, { borderBottomColor: colors.border }]}>
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
                  <View style={[styles.tiersCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {Object.entries(listing.specs).map(([key, value]) => (
                      <View key={key} style={[styles.tierRow, { borderBottomColor: colors.border }]}>
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
          <IconButton name="chevron-back" size={20} onPress={() => router.back()} accessibilityLabel="Go back" />
          {listing && (
            <IconButton
              name="share-outline"
              size={19}
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
            <View style={[styles.disabledCta, { borderColor: colors.border }]}>
              <Ionicons name="bag-handle-outline" size={15} color={colors.textMuted} />
              <Text variant="bodyMedium" tone="muted">
                Coming soon
              </Text>
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text variant="caption" tone="muted">
        {label.toUpperCase()}
      </Text>
      <Text variant="bodyMedium" tone="primary" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  loadingBody: { padding: Spacing.md, gap: Spacing.sm },
  gap: { marginTop: Spacing.sm },
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  overlayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.sm,
  },
  body: { padding: Spacing.md, gap: Spacing.xs },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  vendorRowText: { flexShrink: 1 },
  title: { marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm, marginTop: Spacing.xs },
  priceValue: { flexShrink: 1 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.md },
  metaItem: { minWidth: "28%" },
  section: { marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  sectionTitle: { marginBottom: Spacing.xs },
  description: { lineHeight: 22 },
  tiersCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    gap: 6,
    paddingHorizontal: Spacing.lg,
    height: TouchTarget,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});
