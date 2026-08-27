import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AppLogo } from "@/components/ui/AppLogo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { IconSize, Palette, Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useHome } from "@/features/home/useHome";
import { friendlyErrorMessage } from "@/lib/api/errors";

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

/**
 * Home's top hero is a deliberate, permanently-dark "brand plate" — it
 * always uses Palette.dark directly, not useAppTheme()'s resolved colors —
 * because the official logo asset (see AppLogo.tsx) has a solid black
 * background baked in and needs a dark surface to sit on regardless of
 * which app theme is active. Everything below the hero uses the resolved
 * theme so light-mode Home is its own art-directed light page (warm pearl,
 * charcoal text, pink CTAs, gold accents), not "dark Home with the colors
 * swapped" — see M19.2 report §L.
 */
export default function HomeScreen() {
  const { colors, scheme } = useAppTheme();
  const heroColors = Palette.dark;
  const { data, isPending, isError, error, refetch, isRefetching } = useHome();

  const goToShop = useCallback((categorySlug?: string) => {
    router.push({ pathname: "/(tabs)/shop", params: categorySlug ? { category: categorySlug } : {} });
  }, []);

  const goToListing = useCallback((id: string) => {
    router.push({ pathname: "/listing/[id]", params: { id } });
  }, []);

  const quickActions: QuickAction[] = [
    { key: "shop", label: "Shop", icon: "bag-handle", onPress: () => goToShop() },
    { key: "explore", label: "Explore", icon: "compass", onPress: () => router.push("/(tabs)/explore") },
    { key: "source", label: "Source", icon: "camera", onPress: () => router.push("/(tabs)/source") },
  ];

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={["top"]} contentStyle={styles.screenContent}>
      <View style={[styles.hero, { backgroundColor: heroColors.bg }, scheme === "light" && styles.heroLightSeam]}>
        <View style={styles.logoRow}>
          <AppLogo width={172} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search products and vendors"
            hitSlop={8}
            onPress={() => goToShop()}
            style={styles.searchIcon}
          >
            <Ionicons name="search" size={IconSize.md} color={heroColors.textPrimary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => goToShop()}
          style={[styles.searchField, { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.14)" }]}
          accessibilityRole="button"
          accessibilityLabel="Search products, vendors and categories"
        >
          <Ionicons name="search" size={IconSize.sm} color={heroColors.textSecondary} />
          <Text variant="body" tone="secondary" numberOfLines={1} style={{ color: heroColors.textSecondary }}>
            Search products, vendors&hellip;
          </Text>
        </Pressable>

        <View style={styles.quickActionRow}>
          {quickActions.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: heroColors.goldStrong }]}>
                <Ionicons name={action.icon} size={IconSize.md} color={heroColors.bg} />
              </View>
              <Text variant="smallMedium" style={{ color: heroColors.textPrimary }}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isError && <ErrorState title="Could not load Home" message={friendlyErrorMessage(error)} onRetry={refetch} />}

      {isPending && !isError && (
        <View style={styles.loadingBlock}>
          <View style={styles.loadingRow}>
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} height={32} width={72} radius={Radius.pill} />
            ))}
          </View>
          <View style={styles.loadingRow}>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} height={172} width={148} radius={Radius.md} />
            ))}
          </View>
        </View>
      )}

      {data && (
        <>
          {data.categories.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Shop by category" onPressAction={() => goToShop()} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {data.categories.map((category) => (
                  <CategoryTile key={category.id} label={category.name} onPress={() => goToShop(category.slug)} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Featured products" onPressAction={() => goToShop()} />
            {data.featuredListings.length === 0 ? (
              <Text variant="body" tone="secondary" style={styles.emptyText}>
                New products are on the way — check back soon.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {data.featuredListings.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} width={148} onPress={() => goToListing(listing.id)} />
                ))}
              </ScrollView>
            )}
          </View>

          <Pressable style={[styles.exploreTeaser, { backgroundColor: colors.pinkSurface }]} onPress={() => router.push("/(tabs)/explore")} accessibilityRole="button">
            <View style={[styles.exploreTeaserIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="sparkles" size={20} color={colors.pink} />
            </View>
            <View style={styles.teaserText}>
              <Text variant="bodyMedium" tone="primary">
                See what beauty pros are creating
              </Text>
              <Text variant="small" tone="secondary">
                Browse real work from stylists, salons and MUAs on Explore.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.pink} />
          </Pressable>

          <Pressable style={[styles.sourceCta, { backgroundColor: colors.goldSurface }]} onPress={() => router.push("/(tabs)/source")} accessibilityRole="button">
            <View style={[styles.sourceCtaIcon, { backgroundColor: colors.gold }]}>
              <Ionicons name="camera" size={22} color={colors.surface} />
            </View>
            <View style={styles.teaserText}>
              <Text variant="bodyMedium" tone="primary">
                Looking for something? Source from a photo.
              </Text>
              <Text variant="small" tone="secondary">
                Snap or upload a picture — we&rsquo;ll find a vendor for it.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.goldStrong} />
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: Spacing.xxl },
  hero: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.lg },
  heroLightSeam: { borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  searchIcon: { padding: Spacing.xxs },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  quickActionRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  quickAction: { flex: 1, alignItems: "center", gap: 6 },
  pressed: { opacity: 0.85 },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: Spacing.md },
  loadingRow: { flexDirection: "row", gap: Spacing.sm },
  section: { marginTop: Spacing.lg },
  chipRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  productRow: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  emptyText: { paddingHorizontal: Spacing.md },
  exploreTeaser: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  exploreTeaserIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  teaserText: { flex: 1 },
  sourceCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  sourceCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
