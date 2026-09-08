import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useVendorBeautyProfile } from "@/features/vendor/useVendorBeautyProfessional";
import { ProfileForm, ServicesSection, RequestsSection } from "@/features/vendor/beauty/BeautySections";

/**
 * Beauty Professional profile/services/requests, all in one pushed screen
 * — reachable from Vendor Mode's "More" hub regardless of current
 * Experience Mode (so a Seller who's also a Beauty Professional can still
 * get here without switching). The same three sections also power the
 * dedicated BEAUTY-mode tabs (`(vendor)/services.tsx`, `(vendor)/requests.tsx`)
 * — see BeautySections.tsx's doc comment.
 */
export default function VendorBeautyProfessionalScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorBeautyProfile(ready);

  if (!ready) return null;

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={160} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState title="Couldn't load your profile" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            Beauty Professional
          </Text>
        </View>

        <ProfileForm profile={query.data} />

        {query.data ? (
          <>
            <ServicesSection />
            <RequestsSection />
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
});
