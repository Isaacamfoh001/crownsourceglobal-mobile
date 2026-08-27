import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { ProductCard } from "@/components/ui/ProductCard";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatSellerType } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useVendorStorefront } from "@/features/vendor/useVendorStorefront";
import type { ListingSummaryDTO } from "@/types/api";

/** Vendor Storefront (M19.2 §19): a strong branded identity band (its own `surface` tone, separate from the page bg) that the product grid sits below — deliberately not just plain page background all the way down. */
export default function VendorStorefrontScreen() {
  const { colors } = useAppTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useVendorStorefront(slug);

  const vendor = query.data?.pages[0]?.vendor;
  const listings = useMemo<ListingSummaryDTO[]>(
    () => query.data?.pages.flatMap((page) => page.listings.rows) ?? [],
    [query.data],
  );

  const locationLine = vendor ? [vendor.city, vendor.region, vendor.country].filter(Boolean).join(", ") : null;

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text variant="cardTitle" tone="primary" numberOfLines={1} style={styles.headerTitle}>
          {vendor?.companyName ?? "Vendor"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {query.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={72} width={72} radius={36} />
          <Skeleton height={22} width="60%" style={styles.gap} />
          <Skeleton height={16} width="40%" style={styles.gap} />
        </View>
      )}

      {query.isError && (
        <ErrorState title="Couldn't load this vendor" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      )}

      {vendor && (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          ListHeaderComponent={
            <View style={[styles.identity, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.logoWrap}>
                {vendor.logoUrl ? (
                  <Image source={{ uri: vendor.logoUrl }} style={styles.logo} contentFit="cover" />
                ) : (
                  <View style={[styles.logo, styles.logoFallback, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text variant="screenTitle" tone="primary">
                      {vendor.companyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text variant="screenTitle" tone="primary" numberOfLines={2} style={styles.center}>
                {vendor.companyName}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.goldSurface }]}>
                  <Ionicons name="shield-checkmark" size={13} color={colors.goldStrong} />
                  <Text variant="caption" tone="gold">
                    APPROVED VENDOR
                  </Text>
                </View>
                {formatSellerType(vendor.sellerType) && (
                  <Text variant="small" tone="secondary" numberOfLines={1}>
                    {formatSellerType(vendor.sellerType)}
                  </Text>
                )}
              </View>
              {locationLine ? (
                <Text variant="small" tone="secondary" numberOfLines={2} style={styles.location}>
                  <Ionicons name="location-outline" size={13} /> {locationLine}
                </Text>
              ) : null}
              {vendor.description && (
                <Text variant="body" tone="secondary" style={styles.description}>
                  {vendor.description}
                </Text>
              )}
              <Text variant="sectionHeading" tone="primary" style={styles.listingsTitle}>
                Products
              </Text>
              {listings.length === 0 && !query.isFetchingNextPage && (
                <EmptyState title="No products yet" message="This vendor hasn't published any listings yet." icon="storefront-outline" />
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard listing={item} onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })} />
          )}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: TouchTarget },
  headerTitle: { flex: 1, textAlign: "center" },
  loadingBlock: { padding: Spacing.md, alignItems: "center" },
  gap: { marginTop: Spacing.sm },
  identity: { alignItems: "center", paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  center: { textAlign: "center" },
  logoWrap: { marginBottom: Spacing.sm },
  logo: { width: 84, height: 84, borderRadius: 42 },
  logoFallback: { alignItems: "center", justifyContent: "center" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: Spacing.sm, marginTop: Spacing.xs },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  location: { marginTop: Spacing.xs },
  description: { textAlign: "center", marginTop: Spacing.sm, lineHeight: 21 },
  listingsTitle: { alignSelf: "flex-start", marginTop: Spacing.lg, marginBottom: Spacing.xs },
  grid: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  column: { gap: Spacing.sm },
  footerLoader: { marginVertical: Spacing.md },
});
