import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { VendorMoreButton } from "@/components/navigation/VendorMoreButton";
import { useMyExplorePosts } from "@/features/explore/useMyExplorePosts";

/**
 * BEAUTY-mode primary tab — portfolio (M32.3 §8). Explore posting itself
 * (`explore/create`, `/vendor-explore-posts`) already exists in full from
 * M21 and isn't Beauty-exclusive; this tab is just a focused entry point
 * into it for the Beauty experience, so portfolio work doesn't require
 * digging through "More".
 */
export default function VendorExploreTab() {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const query = useMyExplorePosts(status === "SIGNED_IN");
  const posts = query.data?.rows ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="screenTitle" tone="primary">
          Explore
        </Text>
        <View style={styles.headerActions}>
          <Button label="New post" icon={<Ionicons name="add" size={16} color={colors.textOnAccent} />} onPress={() => router.push("/explore/create")} />
          <VendorMoreButton />
        </View>
      </View>

      {query.isPending ? (
        <View style={styles.list}>
          <Skeleton height={64} radius={Radius.lg} />
        </View>
      ) : posts.length === 0 ? (
        <EmptyState icon="images-outline" title="No posts yet" message="Share your work on Explore so customers can discover your services." />
      ) : (
        <Pressable onPress={() => router.push("/vendor-explore-posts")} style={[styles.summaryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="body" tone="primary" style={styles.flex}>
            {posts.length} post{posts.length === 1 ? "" : "s"}
          </Text>
          <Text variant="small" tone="secondary">
            Manage
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.md },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  list: { paddingHorizontal: Spacing.md },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginHorizontal: Spacing.md, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  flex: { flex: 1 },
});
