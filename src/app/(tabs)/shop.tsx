import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { ProductCard } from "@/components/ui/ProductCard";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useListings } from "@/features/shop/useListings";
import { useCategories } from "@/features/categories/useCategories";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { ListingSummaryDTO } from "@/types/api";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Shop is pure product commerce (AGENTS.md §3, M19.2 §14-16). Its header,
 * category/filter rail, results meta and product grid each own a distinct
 * vertical region — see the four top-level Views below — specifically to
 * fix the M19.2-reported bug where category chips were overlapped by
 * product cards. Root cause: the category rail was a `FlatList` with no
 * explicit height wrapper; a horizontal FlatList's auto-height sizing next
 * to a sibling FlatList is exactly the kind of layout it's easy to get
 * wrong. Fixed by (a) switching the short, non-virtualization-worthy
 * category rail to a plain `ScrollView` — the same pattern Home's category
 * rail already used correctly — inside its own bordered section with fixed
 * vertical padding, and (b) giving the product grid `FlatList` an explicit
 * `flex: 1` so it unambiguously owns the remaining space instead of relying
 * on implicit sizing.
 */
export default function ShopScreen() {
  const { colors } = useAppTheme();
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
        <Text variant="screenTitle" tone="primary">
          Shop
        </Text>
        <SearchField value={searchInput} onChangeText={setSearchInput} placeholder="Search products…" />
      </View>

      {categoriesQuery.data && categoriesQuery.data.categories.length > 0 && (
        <View style={[styles.categorySection, { borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <CategoryTile label="All" selected={!selectedCategory} onPress={() => setSelectedCategory(undefined)} />
            {categoriesQuery.data.categories.map((item) => (
              <CategoryTile key={item.id} label={item.name} selected={selectedCategory === item.slug} onPress={() => setSelectedCategory(item.slug)} />
            ))}
          </ScrollView>
        </View>
      )}

      {!listingsQuery.isPending && !listingsQuery.isError && rows.length > 0 && (
        <View style={styles.resultsMeta}>
          <Text variant="small" tone="secondary">
            {total} product{total === 1 ? "" : "s"}
            {selectedCategoryName ? ` in ${selectedCategoryName}` : ""}
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
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  categorySection: { marginTop: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  chipRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  resultsMeta: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxs },
  loading: { marginTop: Spacing.sm },
  grid: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  column: { gap: Spacing.sm },
  footerLoader: { marginVertical: Spacing.md },
});
