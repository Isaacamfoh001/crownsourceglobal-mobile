import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard } from "@/components/ui/ProductCard";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Spacing } from "@/constants/theme";
import { useExplore } from "@/features/explore/useExplore";
import { friendlyErrorMessage } from "@/lib/api/errors";

/**
 * Explore V1 (MOBILE_V1_PLAN.md section 12): category-diverse discovery
 * rails built entirely from GET /api/v1/explore -- deterministic
 * per-category recency, no personalization, no feed algorithm, no social
 * features.
 */
export default function ExploreScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useExplore();

  const goToListing = useCallback((id: string) => {
    router.push({ pathname: "/listing/[id]", params: { id } });
  }, []);

  const goToShop = useCallback((categorySlug: string) => {
    router.push({ pathname: "/(tabs)/shop", params: { category: categorySlug } });
  }, []);

  return (
    <Screen surface="commerce" onRefresh={refetch} refreshing={isRefetching}>
      <View style={styles.header}>
        <Text variant="h1" tone="onLight">
          Explore
        </Text>
        <Text variant="body" tone="onLightMuted">
          Discover CrownSourceGlobal&rsquo;s marketplace, category by category.
        </Text>
      </View>

      {isError && <ErrorState title="Could not load Explore" message={friendlyErrorMessage(error)} onRetry={refetch} />}

      {isPending && !isError && (
        <View style={styles.loading}>
          <SkeletonCardGrid count={4} />
        </View>
      )}

      {data && data.sections.length === 0 && !isPending && (
        <EmptyState title="Nothing to explore yet" message="New categories and products will appear here as vendors are approved." icon="compass-outline" />
      )}

      {data?.sections.map((section) => (
        <View key={section.category.id} style={styles.section}>
          <SectionHeader title={section.category.name} onPressAction={() => goToShop(section.category.slug)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {section.listings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} width={188} onPress={() => goToListing(listing.id)} />
            ))}
          </ScrollView>
        </View>
      ))}

      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: 4, marginBottom: Spacing.md },
  loading: { marginTop: Spacing.sm },
  section: { marginBottom: Spacing.lg },
  row: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  bottomSpacer: { height: Spacing.xxl },
});
