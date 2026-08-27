import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Color, Radius, Spacing } from "@/constants/theme";
import { useHome } from "@/features/home/useHome";
import { friendlyErrorMessage } from "@/lib/api/errors";

export default function HomeScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useHome();

  const goToShop = useCallback((categorySlug?: string) => {
    router.push({ pathname: "/(tabs)/shop", params: categorySlug ? { category: categorySlug } : {} });
  }, []);

  const goToListing = useCallback((id: string) => {
    router.push({ pathname: "/listing/[id]", params: { id } });
  }, []);

  return (
    <Screen surface="brand" onRefresh={refetch} refreshing={isRefetching} edges={["top"]}>
      <View style={styles.header}>
        <Text variant="display" tone="goldOnDark">
          CrownSourceGlobal
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search products and vendors"
          hitSlop={8}
          onPress={() => goToShop()}
          style={styles.searchIcon}
        >
          <Ionicons name="search" size={22} color={Color.brand.textPrimary} />
        </Pressable>
      </View>
      <Text variant="small" tone="goldOnDark" style={styles.tagline}>
        CONNECT &middot; SOURCE &middot; GROW
      </Text>

      <Pressable onPress={() => goToShop()} style={styles.searchField} accessibilityRole="button" accessibilityLabel="Search products, vendors and categories">
        <Ionicons name="search" size={18} color={Color.brand.textSecondary} />
        <Text variant="body" tone="onDarkMuted">
          Search products, vendors&hellip;
        </Text>
      </Pressable>

      <LinearGradient
        colors={[Color.brand.surfaceAlt, Color.brand.surface, Color.brand.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text variant="h1" tone="onDark" style={styles.heroTitle}>
          Africa&rsquo;s beauty supply chain, sourced globally.
        </Text>
        <Text variant="body" tone="onDarkMuted" style={styles.heroBody}>
          Browse verified vendors, shop authentic hair &amp; beauty products, and source anything you can&rsquo;t
          find.
        </Text>
        <Button label="Explore Now" variant="pink" onPress={() => router.push("/(tabs)/explore")} style={styles.heroButton} />
      </LinearGradient>

      {isError && (
        <ErrorState title="Could not load Home" message={friendlyErrorMessage(error)} onRetry={refetch} tone="onDark" />
      )}

      {isPending && !isError && (
        <View style={styles.loadingBlock}>
          <Skeleton height={36} width="90%" tone="onDark" radius={Radius.pill} style={styles.centerSelf} />
          <View style={styles.loadingRow}>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} height={160} width={150} tone="onDark" radius={Radius.md} />
            ))}
          </View>
        </View>
      )}

      {data && (
        <>
          {data.categories.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Shop by category" tone="onDark" onPressAction={() => goToShop()} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {data.categories.map((category) => (
                  <CategoryTile key={category.id} label={category.name} tone="onDark" onPress={() => goToShop(category.slug)} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Featured products" tone="onDark" onPressAction={() => goToShop()} />
            {data.featuredListings.length === 0 ? (
              <Text variant="body" tone="onDarkMuted" style={styles.emptyText}>
                New products are on the way -- check back soon.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {data.featuredListings.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} width={168} onPress={() => goToListing(listing.id)} />
                ))}
              </ScrollView>
            )}
          </View>

          <Pressable style={styles.sourceCta} onPress={() => router.push("/(tabs)/source")} accessibilityRole="button">
            <View style={styles.sourceCtaIcon}>
              <Ionicons name="earth" size={22} color={Color.brand.bg} />
            </View>
            <View style={styles.sourceCtaText}>
              <Text variant="bodyMedium" tone="onDark">
                Can&rsquo;t find it? Source it.
              </Text>
              <Text variant="small" tone="onDarkMuted">
                Tell us what you need &mdash; we&rsquo;ll find a vendor for it.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Color.goldOnDark} />
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  searchIcon: { padding: Spacing.xxs },
  tagline: { paddingHorizontal: Spacing.md, letterSpacing: 2, marginTop: 2 },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  hero: {
    margin: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Color.brand.border,
    overflow: "hidden",
  },
  heroTitle: { marginBottom: Spacing.xs },
  heroBody: { marginBottom: Spacing.md },
  heroButton: { alignSelf: "flex-start" },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: Spacing.md },
  loadingRow: { flexDirection: "row", gap: Spacing.sm },
  centerSelf: { alignSelf: "center" },
  section: { marginTop: Spacing.xl },
  chipRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  productRow: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  emptyText: { paddingHorizontal: Spacing.md },
  sourceCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    margin: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Color.brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Color.brand.border,
  },
  sourceCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Color.goldOnDark,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceCtaText: { flex: 1 },
});
