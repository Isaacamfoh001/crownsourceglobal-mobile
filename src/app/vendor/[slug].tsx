import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { ProductCard } from "@/components/ui/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Color, Radius, Spacing } from "@/constants/theme";
import { formatSellerType } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useVendorStorefront } from "@/features/vendor/useVendorStorefront";
import type { ListingSummaryDTO } from "@/types/api";

export default function VendorStorefrontScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useVendorStorefront(slug);

  const vendor = query.data?.pages[0]?.vendor;
  const listings = useMemo<ListingSummaryDTO[]>(
    () => query.data?.pages.flatMap((page) => page.listings.rows) ?? [],
    [query.data],
  );

  const locationLine = vendor ? [vendor.city, vendor.region, vendor.country].filter(Boolean).join(", ") : null;

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={Color.commerce.textPrimary} />
        </Pressable>
        <Text variant="title" tone="onLight" numberOfLines={1} style={styles.headerTitle}>
          {vendor?.companyName ?? "Vendor"}
        </Text>
        <View style={styles.backButton} />
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
            <View style={styles.identity}>
              <View style={styles.logoWrap}>
                {vendor.logoUrl ? (
                  <Image source={{ uri: vendor.logoUrl }} style={styles.logo} contentFit="cover" />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Text variant="h1" tone="onLight">
                      {vendor.companyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text variant="h1" tone="onLight">
                {vendor.companyName}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={13} color={Color.goldStrong} />
                  <Text variant="caption" tone="goldOnLight">
                    APPROVED VENDOR
                  </Text>
                </View>
                {formatSellerType(vendor.sellerType) && (
                  <Text variant="small" tone="onLightMuted">
                    {formatSellerType(vendor.sellerType)}
                  </Text>
                )}
              </View>
              {locationLine ? (
                <Text variant="small" tone="onLightMuted" style={styles.location}>
                  <Ionicons name="location-outline" size={13} /> {locationLine}
                </Text>
              ) : null}
              {vendor.description && (
                <Text variant="body" tone="onLightMuted" style={styles.description}>
                  {vendor.description}
                </Text>
              )}
              <Text variant="h2" tone="onLight" style={styles.listingsTitle}>
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
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={Color.pink} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Color.commerce.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center" },
  loadingBlock: { padding: Spacing.md, alignItems: "center" },
  gap: { marginTop: Spacing.sm },
  identity: { alignItems: "center", paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  logoWrap: { marginBottom: Spacing.sm },
  logo: { width: 84, height: 84, borderRadius: 42 },
  logoFallback: { backgroundColor: Color.commerce.surfaceSubtle, alignItems: "center", justifyContent: "center" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.xs },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F4EEE0",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  location: { marginTop: Spacing.xs },
  description: { textAlign: "center", marginTop: Spacing.sm, lineHeight: 21 },
  listingsTitle: { alignSelf: "flex-start", marginTop: Spacing.lg, marginBottom: Spacing.xs },
  grid: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  column: { gap: Spacing.sm },
  footerLoader: { marginVertical: Spacing.md },
});
