import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { Text } from "@/components/ui/Text";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Color, Radius, Spacing } from "@/constants/theme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useListingDetail } from "@/features/listing/useListingDetail";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isPending, isError, error, refetch } = useListingDetail(id);

  return (
    <View style={styles.flex}>
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
          <SafeAreaView edges={["top"]} style={styles.errorSafeArea}>
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
                <Text variant="smallMedium" tone="onLightMuted">
                  {listing.vendor.companyName}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Color.commerce.textSecondary} />
              </Pressable>

              <Text variant="h1" tone="onLight" style={styles.title}>
                {listing.title}
              </Text>

              <View style={styles.priceRow}>
                <Text variant="h1" tone="pink">
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
                <View style={styles.section}>
                  <Text variant="h2" tone="onLight" style={styles.sectionTitle}>
                    Bulk pricing
                  </Text>
                  <View style={styles.tiersCard}>
                    {listing.bulkPriceTiers.map((tier) => (
                      <View key={tier.id} style={styles.tierRow}>
                        <Text variant="body" tone="onLightMuted">
                          {tier.maxQuantity ? `${tier.minQuantity}–${tier.maxQuantity} units` : `${tier.minQuantity}+ units`}
                        </Text>
                        <Text variant="bodyMedium" tone="onLight">
                          {formatMoney(tier.unitPrice)} / unit
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text variant="h2" tone="onLight" style={styles.sectionTitle}>
                  Description
                </Text>
                <Text variant="body" tone="onLightMuted" style={styles.description}>
                  {listing.description}
                </Text>
              </View>

              {listing.specs && Object.keys(listing.specs).length > 0 && (
                <View style={styles.section}>
                  <Text variant="h2" tone="onLight" style={styles.sectionTitle}>
                    Specifications
                  </Text>
                  <View style={styles.tiersCard}>
                    {Object.entries(listing.specs).map(([key, value]) => (
                      <View key={key} style={styles.tierRow}>
                        <Text variant="body" tone="onLightMuted" style={styles.specKey}>
                          {key}
                        </Text>
                        <Text variant="bodyMedium" tone="onLight" style={styles.specValue}>
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
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={Color.commerce.textPrimary} />
        </Pressable>
      </SafeAreaView>

      {listing && (
        <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
          <View style={styles.actionBarInner}>
            <View>
              <Text variant="caption" tone="onLightFaint">
                PRICE
              </Text>
              <Text variant="h2" tone="pink">
                {formatMoney(listing.price)}
              </Text>
            </View>
            <View style={styles.disabledCta}>
              <Text variant="bodyMedium" tone="onLightFaint">
                Add to Cart
              </Text>
              <Text variant="caption" tone="onLightFaint">
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
      <Text variant="caption" tone="onLightFaint">
        {label.toUpperCase()}
      </Text>
      <Text variant="bodyMedium" tone="onLight">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Color.commerce.bg },
  scrollContent: { paddingBottom: 110 },
  loadingBody: { padding: Spacing.md, gap: Spacing.sm },
  gap: { marginTop: Spacing.sm },
  errorSafeArea: { backgroundColor: Color.commerce.bg },
  headerOverlay: { position: "absolute", top: 0, left: 0 },
  backButton: {
    marginTop: Spacing.sm,
    marginLeft: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: Spacing.md, gap: Spacing.xs },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  title: { marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.xs },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginTop: Spacing.md },
  metaItem: { minWidth: "28%" },
  section: { marginTop: Spacing.lg },
  sectionTitle: { marginBottom: Spacing.xs },
  description: { lineHeight: 22 },
  tiersCard: {
    backgroundColor: Color.commerce.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Color.commerce.border,
    overflow: "hidden",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Color.commerce.border,
  },
  specKey: { textTransform: "capitalize", flex: 1 },
  specValue: { flex: 1, textAlign: "right" },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Color.commerce.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Color.commerce.border,
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  disabledCta: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Color.commerce.surfaceSubtle,
  },
});
