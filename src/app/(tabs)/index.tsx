import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AppLogo } from "@/components/ui/AppLogo";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { IconSize, Palette, Radius, Spacing, TouchTarget, type ThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useHome } from "@/features/home/useHome";
import { getTimeOfDayGreeting } from "@/lib/greeting";
import { friendlyErrorMessage } from "@/lib/api/errors";

type CapabilityItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

/**
 * Logo width scales with the screen instead of a fixed pixel value — 40% of
 * screen width lands close to the client reference's proportion on a
 * 375–393pt phone, clamped so it can't shrink below comfortable legibility
 * on a 320pt screen or balloon into a large-phone/tablet centerpiece. This
 * deliberately does not use the wider 68–76%-of-width/300–320pt-max range
 * floated for this milestone — that range renders too large in practice
 * (crowds the header, edges near the greeting, contradicts "must not
 * dominate the greeting" in the same spec) once actually checked against
 * this asset at these breakpoints.
 */
const LOGO_WIDTH_MIN = 130;
const LOGO_WIDTH_MAX = 190;
const LOGO_WIDTH_SCREEN_FACTOR = 0.4;

/**
 * Home's top brand band is a deliberate, permanently-dark "brand plate" —
 * it always uses Palette.dark directly, not useAppTheme()'s resolved
 * colors. The logo itself is transparent now (see AppLogo.tsx / M19.2.2
 * report), so this is a design choice for gold-on-dark contrast rather than
 * a technical requirement, and it stays true regardless of which app theme
 * is active. Everything below the band uses the
 * resolved theme so light-mode Home is its own art-directed light page
 * (warm pearl, charcoal text, pink CTAs, gold accents), not "dark Home
 * with the colors swapped" — see M19.2 report §L.
 *
 * M19.2.1 extends that band to cover header → greeting → search → hero →
 * capability grid as one continuous dark surface (matching the client
 * reference's center Home mockup), rather than stopping after the search
 * field the way M19.2 did.
 */
export default function HomeScreen() {
  const { scheme } = useAppTheme();
  const heroColors = Palette.dark;
  const { data, isPending, isError, error, refetch, isRefetching } = useHome();
  const { width: windowWidth } = useWindowDimensions();
  const logoWidth = Math.min(Math.max(windowWidth * LOGO_WIDTH_SCREEN_FACTOR, LOGO_WIDTH_MIN), LOGO_WIDTH_MAX);

  // Real first name once signed in (M20.2 §15, via GET /api/v1/me — see
  // useAuth()); undefined while signed out or before /me resolves, which
  // correctly falls back to the greeting alone below. Never fabricated.
  const { me } = useAuth();
  const firstName = me?.user.name.trim().split(/\s+/)[0];
  const greeting = getTimeOfDayGreeting();

  const goToShop = useCallback((categorySlug?: string) => {
    router.push({ pathname: "/(tabs)/shop", params: categorySlug ? { category: categorySlug } : {} });
  }, []);

  const goToListing = useCallback((id: string) => {
    router.push({ pathname: "/listing/[id]", params: { id } });
  }, []);

  const capabilities: CapabilityItem[] = [
    { key: "marketplace", label: "Marketplace", icon: "storefront-outline", onPress: () => goToShop() },
    { key: "beauty-services", label: "Beauty Services", icon: "sparkles-outline", onPress: () => router.push("/beauty-services") },
    { key: "explore", label: "Explore", icon: "compass-outline", onPress: () => router.push("/(tabs)/explore") },
    { key: "source", label: "Source", icon: "camera-outline", onPress: () => router.push("/(tabs)/source") },
    { key: "account", label: "Account", icon: "person-circle-outline", onPress: () => router.push("/(tabs)/account") },
  ];

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching} edges={["top"]} contentStyle={styles.screenContent}>
      <View style={[styles.hero, { backgroundColor: heroColors.bg }, scheme === "light" && styles.heroLightSeam]}>
        <View style={styles.headerRow}>
          <View style={styles.headerSideSpacer} />
          <AppLogo width={logoWidth} />
          <NotificationBell colors={heroColors} />
        </View>

        <View style={styles.greetingBlock}>
          <Text variant="screenTitle" style={{ color: heroColors.textPrimary }}>
            {greeting}
            {firstName ? `, ${firstName}` : ""} 👋
          </Text>
          <Text variant="body" style={{ color: heroColors.textSecondary, marginTop: 2 }}>
            What would you like to do today?
          </Text>
        </View>

        <Pressable
          onPress={() => goToShop()}
          style={[styles.searchPill, { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.14)" }]}
          accessibilityRole="button"
          accessibilityLabel="Search products, vendors and categories"
        >
          <Ionicons name="search" size={IconSize.sm} color={heroColors.textMuted} />
          <Text variant="body" numberOfLines={1} style={[styles.searchPlaceholder, { color: heroColors.textMuted }]}>
            Search products, vendors&hellip;
          </Text>
          <View style={[styles.searchButton, { backgroundColor: heroColors.pink }]}>
            <Ionicons name="search" size={IconSize.sm} color={heroColors.textOnAccent} />
          </View>
        </Pressable>

        <LinearGradient
          colors={[heroColors.elevated, heroColors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: heroColors.borderPremium }]}
        >
          <Text variant="sectionHeading" style={{ color: heroColors.textPrimary }}>
            Everything Beauty. One Platform.
          </Text>
          <Text variant="body" style={{ color: heroColors.textSecondary, marginTop: Spacing.xxs }}>
            Discover products, professionals and inspiration — or source exactly what you need.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/explore")}
            style={({ pressed }) => [styles.heroCta, { backgroundColor: heroColors.pink }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Explore Now"
          >
            <Text variant="smallMedium" style={{ color: heroColors.textOnAccent }}>
              Explore Now
            </Text>
            <Ionicons name="arrow-forward" size={IconSize.sm} color={heroColors.textOnAccent} />
          </Pressable>
        </LinearGradient>

        <View style={styles.capabilityGrid}>
          {capabilities.map((item) => (
            <CapabilityCard key={item.key} item={item} colors={heroColors} />
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
        </>
      )}
    </Screen>
  );
}

function CapabilityCard({ item, colors }: { item: CapabilityItem; colors: ThemeColors }) {
  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={({ pressed }) => [styles.capabilityCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
    >
      <View style={[styles.capabilityIcon, { backgroundColor: colors.goldSurface }]}>
        <Ionicons name={item.icon} size={IconSize.md} color={colors.goldStrong} />
      </View>
      <Text variant="smallMedium" numberOfLines={2} style={[styles.capabilityLabel, { color: colors.textPrimary }]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: Spacing.xxl },
  hero: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.lg },
  heroLightSeam: { borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerSideSpacer: { width: TouchTarget, height: TouchTarget },

  greetingBlock: { marginTop: Spacing.sm, paddingHorizontal: Spacing.xxs },

  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingLeft: Spacing.md,
    paddingRight: 4,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  searchPlaceholder: { flex: 1 },
  searchButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  heroCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 38,
    borderRadius: Radius.pill,
  },
  pressed: { opacity: 0.85 },

  capabilityGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.md },
  capabilityCard: {
    flexBasis: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  capabilityIcon: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  capabilityLabel: { textAlign: "center" },

  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: Spacing.md },
  loadingRow: { flexDirection: "row", gap: Spacing.sm },
  section: { marginTop: Spacing.lg },
  chipRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  productRow: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  emptyText: { paddingHorizontal: Spacing.md },
});
