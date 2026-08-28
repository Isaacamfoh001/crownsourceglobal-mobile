import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { SearchField } from "@/components/ui/SearchField";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { BeautyProfessionalCard } from "@/components/ui/BeautyProfessionalCard";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useBeautyProfessionals } from "@/features/beauty-services/useBeautyProfessionals";
import { useExploreCategories } from "@/features/explore/useExploreCategories";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { BeautyProfessionalSummaryDTO } from "@/types/api";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Beauty Services discovery (M22 §9) — public, no sign-in required to
 * browse (§13). Deliberately its own screen, not a Shop or Explore variant:
 * this is "find a trusted professional and request their service", not
 * commerce browsing (Shop) or visual inspiration scrolling (Explore).
 * Reuses Explore's own category taxonomy (useExploreCategories) — Beauty
 * Services and Explore share the exact same "type of beauty work" chips by
 * design (prisma/schema.prisma's BeautyProfessionalProfile doc comment).
 */
export default function BeautyServicesScreen() {
  const { colors } = useAppTheme();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const categoriesQuery = useExploreCategories();
  const feedQuery = useBeautyProfessionals(selectedCategory, appliedSearch || undefined);

  const rows = useMemo<BeautyProfessionalSummaryDTO[]>(
    () => feedQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [feedQuery.data],
  );

  const goToProfessional = (id: string) => router.push({ pathname: "/beauty-services/[id]", params: { id } });

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
          <View style={styles.titleTextCol}>
            <Text variant="screenTitle" tone="primary">
              Beauty Services
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <Text variant="body" tone="secondary" style={styles.subtitle}>
          Find trusted beauty professionals for your next look.
        </Text>
        <SearchField value={searchInput} onChangeText={setSearchInput} placeholder="Search professionals…" />
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

      <View style={styles.flex}>
        {feedQuery.isError && (
          <ErrorState title="Couldn't load Beauty Services" message={friendlyErrorMessage(feedQuery.error)} onRetry={() => feedQuery.refetch()} />
        )}

        {feedQuery.isPending && !feedQuery.isError && (
          <View style={styles.loading}>
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} height={104} radius={16} />
            ))}
          </View>
        )}

        {!feedQuery.isPending && !feedQuery.isError && rows.length === 0 && (
          <EmptyState
            title={appliedSearch ? "No matches found" : "No professionals yet"}
            message={
              appliedSearch
                ? `Nothing matched "${appliedSearch}". Try a different search.`
                : "Check back soon — beauty professionals are joining CrownSourceGlobal regularly."
            }
          />
        )}

        {!feedQuery.isPending && !feedQuery.isError && rows.length > 0 && (
          <FlatList
            style={styles.flex}
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
            }}
            refreshing={feedQuery.isRefetching}
            onRefresh={() => feedQuery.refetch()}
            renderItem={({ item }) => (
              <BeautyProfessionalCard professional={item} onPress={() => goToProfessional(item.id)} />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={feedQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.pink} /> : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleTextCol: { flex: 1, alignItems: "center" },
  headerSpacer: { width: TouchTarget },
  subtitle: { marginTop: -4, textAlign: "center" },
  categorySection: { marginTop: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  chipRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  loading: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl },
  separator: { height: Spacing.sm },
  footerLoader: { marginVertical: Spacing.md },
});
