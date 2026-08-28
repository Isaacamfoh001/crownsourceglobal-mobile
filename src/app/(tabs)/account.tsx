import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { AppearanceSetting } from "@/components/ui/AppearanceSetting";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { friendlyErrorMessage } from "@/lib/api/errors";
import type { MeResponseDTO } from "@/types/api";

const SIGNED_OUT_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "receipt-outline", label: "Manage orders" },
  { icon: "earth-outline", label: "Track sourcing requests" },
  { icon: "heart-outline", label: "Save products for later" },
  { icon: "storefront-outline", label: "Sell your own products" },
];

/**
 * Account screen (M20.2 §14) — real signed-out and signed-in states backed
 * by @better-auth/expo's session and GET /api/v1/me. No fabricated
 * data: Vendor/order/sourcing sections only render when the real /me
 * response actually contains them.
 */
export default function AccountScreen() {
  const { status, me, isMeLoading, meError, refetchMe, signOut } = useAuth();

  if (status === "LOADING") {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Skeleton height={72} width={72} radius={36} />
          <Skeleton height={20} width={160} radius={Radius.sm} />
          <Skeleton height={16} width={220} radius={Radius.sm} />
        </View>
      </Screen>
    );
  }

  if (status === "SIGNED_OUT") {
    return <SignedOutAccount />;
  }

  if (isMeLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Skeleton height={72} width={72} radius={36} />
          <Skeleton height={20} width={160} radius={Radius.sm} />
          <Skeleton height={16} width={220} radius={Radius.sm} />
        </View>
      </Screen>
    );
  }

  if (meError || !me) {
    return (
      <Screen>
        <ErrorState title="Couldn't load your account" message={friendlyErrorMessage(meError)} onRetry={refetchMe} />
      </Screen>
    );
  }

  return <SignedInAccount me={me} onSignOut={signOut} />;
}

function SignedOutAccount() {
  const { colors } = useAppTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.textPrimary }]}>
          <Ionicons name="person" size={34} color={colors.surface} />
        </View>

        <Text variant="screenTitle" tone="primary" style={styles.center}>
          Sign in to manage your account
        </Text>
        <Text variant="body" tone="secondary" style={[styles.center, styles.body]}>
          Sign in to manage orders, sourcing requests, saved items and your CrownSourceGlobal profile.
        </Text>

        <View style={styles.authActions}>
          <Button label="Sign in" onPress={() => router.push("/(auth)/sign-in")} fullWidth />
          <Button label="Create account" variant="outline" onPress={() => router.push("/(auth)/sign-up")} fullWidth />
        </View>

        <View style={styles.section}>
          <AppearanceSetting />
        </View>

        <View style={styles.list}>
          {SIGNED_OUT_BENEFITS.map((item) => (
            <View key={item.label} style={[styles.listRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.listIcon, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
              </View>
              <Text variant="body" tone="secondary">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function SignedInAccount({ me, onSignOut }: { me: MeResponseDTO; onSignOut: () => Promise<void> }) {
  const { colors } = useAppTheme();
  const initial = me.user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.textPrimary }]}>
          <Text variant="screenTitle" style={{ color: colors.surface }}>
            {initial}
          </Text>
        </View>

        <Text variant="screenTitle" tone="primary" style={styles.center}>
          {me.user.name}
        </Text>
        <Text variant="body" tone="secondary" style={styles.center}>
          {me.user.email}
        </Text>

        {!me.user.emailVerified && (
          <View style={[styles.badge, { borderColor: colors.warning }]}>
            <Text variant="caption" tone="warning">
              EMAIL NOT VERIFIED
            </Text>
          </View>
        )}

        {me.vendor.available && (
          <View style={styles.section}>
            <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
              YOUR STORE
            </Text>
            {me.vendor.memberships.map((membership) => (
              <View key={membership.vendorId} style={[styles.listRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.listIcon, { backgroundColor: colors.goldSurface }]}>
                  <Ionicons name="storefront-outline" size={18} color={colors.goldStrong} />
                </View>
                <View style={styles.flex}>
                  <Text variant="bodyMedium" tone="primary">
                    {membership.companyName}
                  </Text>
                  <Text variant="small" tone="secondary">
                    {membership.verificationStatus}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!me.vendor.available && me.vendorApplication && (
          <View style={styles.section}>
            <View style={[styles.listRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.listIcon, { backgroundColor: colors.goldSurface }]}>
                <Ionicons name="time-outline" size={18} color={colors.goldStrong} />
              </View>
              <Text variant="body" tone="secondary">
                Vendor application {me.vendorApplication.status.toLowerCase().replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <AppearanceSetting />
        </View>

        <View style={styles.list}>
          <Pressable
            onPress={() => router.push("/beauty-services/my-requests")}
            accessibilityRole="button"
            style={[styles.listRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.listIcon, { backgroundColor: colors.goldSurface }]}>
              <Ionicons name="sparkles-outline" size={18} color={colors.goldStrong} />
            </View>
            <Text variant="body" tone="primary" style={styles.flex}>
              Service requests
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {[
            { icon: "receipt-outline" as const, label: "Orders" },
            { icon: "earth-outline" as const, label: "Sourcing requests" },
            { icon: "heart-outline" as const, label: "Saved products" },
            { icon: "chatbubble-ellipses-outline" as const, label: "Messages" },
          ].map((item) => (
            <View key={item.label} style={[styles.listRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.listIcon, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
              </View>
              <Text variant="body" tone="secondary">
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <Button label="Sign out" variant="outline" onPress={onSignOut} fullWidth style={styles.signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.md },
  loadingContainer: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.md },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  center: { textAlign: "center" },
  body: { marginBottom: Spacing.xs },
  authActions: { alignSelf: "stretch", gap: Spacing.sm, marginTop: Spacing.xs },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  section: { alignSelf: "stretch", marginTop: Spacing.lg },
  sectionLabel: { marginBottom: Spacing.xs, letterSpacing: 0.5 },
  list: { alignSelf: "stretch", marginTop: Spacing.lg, gap: Spacing.sm },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  signOut: { marginTop: Spacing.lg },
});
