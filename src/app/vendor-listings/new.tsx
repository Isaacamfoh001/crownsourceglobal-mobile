import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { ErrorState } from "@/components/ui/StateViews";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategories } from "@/features/categories/useCategories";
import { useCreateVendorListingDraft } from "@/features/vendor/useVendorListings";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";

/** New listing entry point (M27 §7) — pick a category, then the empty DRAFT opens straight into the edit form. */
export default function NewVendorListingScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const categoriesQuery = useCategories();
  const createDraft = useCreateVendorListingDraft();

  if (!ready) return null;

  const onSelect = (categoryId: string) => {
    if (createDraft.isPending) return;
    createDraft.mutate(categoryId, {
      onSuccess: (result) => {
        router.replace({ pathname: "/vendor-listings/[id]", params: { id: result.id } });
      },
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          New listing
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text variant="body" tone="secondary">
          Choose a category to start
        </Text>
        {categoriesQuery.isPending ? (
          <Text variant="small" tone="muted">
            Loading categories…
          </Text>
        ) : categoriesQuery.isError ? (
          <ErrorState title="Couldn't load categories" message={friendlyErrorMessage(categoriesQuery.error)} onRetry={() => categoriesQuery.refetch()} />
        ) : (
          <View style={styles.categoryRow}>
            {(categoriesQuery.data?.categories ?? []).map((category) => (
              <CategoryTile key={category.id} label={category.name} selected={false} onPress={() => onSelect(category.id)} />
            ))}
          </View>
        )}
        {createDraft.isError ? (
          <Text variant="small" tone="error">
            {friendlyErrorMessage(createDraft.error)}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  content: { padding: Spacing.md, gap: Spacing.md },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
});
