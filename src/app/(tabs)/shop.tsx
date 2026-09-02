import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { CategoryIconTile } from "@/components/ui/CategoryIconTile";
import { ProductCard } from "@/components/ui/ProductCard";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { CartIcon } from "@/components/ui/CartIcon";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/features/cart/useCart";
import { useListings } from "@/features/shop/useListings";
import { useCategories } from "@/features/categories/useCategories";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { ListingSummaryDTO } from "@/types/api";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Shop is pure product commerce (AGENTS.md §3, M22.3 §3-9) — deep
 * art-direction rebuild: a visual icon-led category rail (CategoryIconTile,
 * not the text-only CategoryTile pill), and a merchandise-forward
 * ProductCard grid, closer to the client's Marketplace reference than a
 * generic list-of-records screen.
 *
 * No sort control: `/api/v1/listings` has no `sort` param (see that
 * route's own doc comment — "no sort exists on the web today, not
 * invented for this API"), so the results line states the real, honest
 * order ("Newest first") instead of presenting a filter/sort affordance
 * that would silently do nothing (M22.3 §6).
 */
export default function ShopScreen() {
  const { colors } = useAppTheme();
  const { status: authStatus } = useAuth();
  const cartQuery = useCart(authStatus === "SIGNED_IN");
  const params = useLocalSearchParams<{ category?: string }>();
  const incomingCategory = typeof params.category === "string" ? params.category : undefined;
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(incomingCategory);

  // Adjust state during render when the navigation param changes (e.g. tapping
  // a different category from Home while Shop is already mounted) rather than
  // syncing it in an effect — see https://react.dev/learn/you-might-not-need-an-effect.
  const [lastIncomingCategory, setLastIncomingCategory] = useState(incomingCategory);
  if (incomingCategory !== lastIncomingCategory) {
    setLastIncomingCategory(incomingCategory);
    setSelectedCategory(incomingCategory);
  }

  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const categoriesQuery = useCategories();
  const listingsQuery = useListings({ search: appliedSearch || undefined, category: selectedCategory });

  const rows = useMemo<ListingSummaryDTO[]>(
    () => listingsQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [listingsQuery.data],
  );
  const total = listingsQuery.data?.pages[0]?.total ?? rows.length;

  const selectedCategoryName = useMemo(
    () => categoriesQuery.data?.categories.find((category) => category.slug === selectedCategory)?.name,
    [categoriesQuery.data, selectedCategory],
  );

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="sectionHeading" tone="primary">
            Shop
          </Text>
          <CartIcon onPress={() => router.push("/cart")} itemCount={authStatus === "SIGNED_IN" ? cartQuery.data?.itemCount : undefined} />
        </View>
        <SearchField value={searchInput} onChangeText={setSearchInput} placeholder="Search products…" />
      </View>

      {categoriesQuery.data && categoriesQuery.data.categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRail}
          contentContainerStyle={styles.categoryRailContent}
        >
          <CategoryIconTile label="All" icon="grid-outline" selected={!selectedCategory} onPress={() => setSelectedCategory(undefined)} />
          {categoriesQuery.data.categories.map((item) => (
            <CategoryIconTile
              key={item.id}
              label={item.name}
              icon={getCategoryIcon(item.slug)}
              selected={selectedCategory === item.slug}
              onPress={() => setSelectedCategory(item.slug)}
            />
          ))}
        </ScrollView>
      )}

      {!listingsQuery.isPending && !listingsQuery.isError && rows.length > 0 && (
        <View style={[styles.resultsMeta, { borderBottomColor: colors.border }]}>
          <Text variant="small" tone="secondary">
            {total} product{total === 1 ? "" : "s"}
            {selectedCategoryName ? ` in ${selectedCategoryName}` : ""}
          </Text>
          <Text variant="small" tone="muted">
            Newest first
          </Text>
        </View>
      )}

      <View style={styles.flex}>
        {listingsQuery.isError && (
          <ErrorState title="Couldn't load listings" message={friendlyErrorMessage(listingsQuery.error)} onRetry={() => listingsQuery.refetch()} />
        )}

        {listingsQuery.isPending && !listingsQuery.isError && (
          <View style={styles.loading}>
            <SkeletonCardGrid count={6} />
          </View>
        )}

        {!listingsQuery.isPending && !listingsQuery.isError && rows.length === 0 && (
          <EmptyState
            title={appliedSearch ? "No matches found" : "No products yet"}
            message={
              appliedSearch
                ? `Nothing matched "${appliedSearch}"${selectedCategoryName ? ` in ${selectedCategoryName}` : ""}. Try a different search.`
                : "Check back soon — vendors are adding new products regularly."
            }
          />
        )}

        {!listingsQuery.isPending && !listingsQuery.isError && rows.length > 0 && (
          <FlatList
            style={styles.flex}
            data={rows}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.column}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage) listingsQuery.fetchNextPage();
            }}
            refreshing={listingsQuery.isRefetching}
            onRefresh={() => listingsQuery.refetch()}
            renderItem={({ item }) => (
              <ProductCard listing={item} onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })} />
            )}
            ListFooterComponent={listingsQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, gap: Spacing.xs },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  // Load-bearing: ScrollView defaults to flexGrow:1, which stretched this into the "massive gap" bug — see the M23.1 report.
  categoryRail: { flexGrow: 0, flexShrink: 0 },
  categoryRailContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  resultsMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  loading: { marginTop: Spacing.sm },
  grid: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  column: { gap: Spacing.sm },
  footerLoader: { marginVertical: Spacing.md },
});
