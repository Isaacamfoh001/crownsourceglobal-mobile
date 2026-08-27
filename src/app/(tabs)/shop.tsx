import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { ProductCard } from "@/components/ui/ProductCard";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Color, Spacing } from "@/constants/theme";
import { useListings } from "@/features/shop/useListings";
import { useCategories } from "@/features/categories/useCategories";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { ListingSummaryDTO } from "@/types/api";

const SEARCH_DEBOUNCE_MS = 400;

export default function ShopScreen() {
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

  const selectedCategoryName = useMemo(
    () => categoriesQuery.data?.categories.find((category) => category.slug === selectedCategory)?.name,
    [categoriesQuery.data, selectedCategory],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <View style={styles.header}>
        <Text variant="h1" tone="onLight">
          Shop
        </Text>
        <SearchField value={searchInput} onChangeText={setSearchInput} placeholder="Search products…" tone="onLight" />
      </View>

      {categoriesQuery.data && categoriesQuery.data.categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoriesQuery.data.categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chipRow}
          style={styles.chipList}
          ListHeaderComponent={
            <CategoryTile label="All" selected={!selectedCategory} onPress={() => setSelectedCategory(undefined)} />
          }
          renderItem={({ item }) => (
            <CategoryTile label={item.name} selected={selectedCategory === item.slug} onPress={() => setSelectedCategory(item.slug)} />
          )}
        />
      )}

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
          ListFooterComponent={
            listingsQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={Color.pink} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Color.commerce.bg },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm, marginBottom: Spacing.sm },
  chipList: { flexGrow: 0, marginBottom: Spacing.sm },
  chipRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  loading: { marginTop: Spacing.sm },
  grid: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  column: { gap: Spacing.sm },
  footerLoader: { marginVertical: Spacing.md },
});
