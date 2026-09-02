import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { AppLogo } from "@/components/ui/AppLogo";
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
        <AppLogo width={96} />

        <Text variant="screenTitle" tone="primary" style={[styles.center, styles.title]}>
          Sign in for the full experience
        </Text>
        <Text variant="body" tone="secondary" style={styles.center}>
          Orders, sourcing requests and saved items, all in one place.
        </Text>

        <View style={styles.authActions}>
          <Button label="Sign in" onPress={() => router.push("/(auth)/sign-in")} fullWidth />
          <Button label="Create account" variant="outline" onPress={() => router.push("/(auth)/sign-up")} fullWidth />
        </View>

        <View style={styles.valueList}>
          {SIGNED_OUT_BENEFITS.map((item, index) => (
            <View
              key={item.label}
              style={[styles.valueRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <Ionicons name={item.icon} size={18} color={colors.goldStrong} />
              <Text variant="body" tone="secondary">
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <AppearanceSetting />
        </View>
      </View>
    </Screen>
  );
}

function SignedInAccount({ me, onSignOut }: { me: MeResponseDTO; onSignOut: () => Promise<void> }) {
  const { colors } = useAppTheme();
  const initial = me.user.name.trim().charAt(0).toUpperCase() || "?";

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }[] = [
    { icon: "sparkles-outline", label: "Service requests", onPress: () => router.push("/beauty-services/my-requests") },
    { icon: "receipt-outline", label: "Orders" },
    { icon: "earth-outline", label: "Sourcing requests", onPress: () => router.push("/sourcing/my-requests") },
    { icon: "document-text-outline", label: "Quotations", onPress: () => router.push("/quotations") },
    { icon: "heart-outline", label: "Saved products" },
    { icon: "chatbubble-ellipses-outline", label: "Messages" },
  ];

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.avatar, { backgroundColor: colors.textPrimary, borderColor: colors.gold }]}>
          <Text variant="screenTitle" style={{ color: colors.surface }}>
            {initial}
          </Text>
        </View>

        <Text variant="screenTitle" tone="primary" style={styles.center}>
          {me.user.name}
        </Text>
        <Text variant="small" tone="secondary" style={styles.center}>
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
            <View style={[styles.groupedList, { backgroundColor: colors.surface }]}>
              {me.vendor.memberships.map((membership, index) => (
                <View
                  key={membership.vendorId}
                  style={[styles.groupedRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                >
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
            <Button label="Enter Vendor Mode" onPress={() => router.push("/(vendor)")} style={styles.vendorModeButton} fullWidth />
          </View>
        )}

        {!me.vendor.available && me.vendorApplication && (
          <View style={styles.section}>
            <Pressable onPress={() => router.push("/vendor-onboarding")} style={[styles.groupedList, { backgroundColor: colors.surface }]}>
              <View style={styles.groupedRow}>
                <View style={[styles.listIcon, { backgroundColor: colors.goldSurface }]}>
                  <Ionicons name="time-outline" size={18} color={colors.goldStrong} />
                </View>
                <Text variant="body" tone="secondary" style={styles.flex}>
                  Vendor application {me.vendorApplication.status.toLowerCase().replace(/_/g, " ")}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>
          </View>
        )}

        {!me.vendor.available && !me.vendorApplication && (
          <View style={styles.section}>
            <Pressable
              onPress={() => router.push("/vendor-onboarding")}
              style={[styles.groupedList, styles.startSellingRow, { backgroundColor: colors.goldSurface, borderColor: colors.gold }]}
            >
              <View style={[styles.listIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="storefront-outline" size={18} color={colors.goldStrong} />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyMedium" tone="primary">
                  Start selling
                </Text>
                <Text variant="small" tone="secondary">
                  Apply to become a CrownSourceGlobal vendor
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.goldStrong} />
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <View style={[styles.groupedList, { backgroundColor: colors.surface }]}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                disabled={!item.onPress}
                accessibilityRole="button"
                style={[styles.groupedRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
              >
                <View style={[styles.listIcon, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
                </View>
                <Text variant="body" tone={item.onPress ? "primary" : "secondary"} style={styles.flex}>
                  {item.label}
                </Text>
                {item.onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppearanceSetting />
        </View>

        <Button label="Sign out" variant="outline" onPress={onSignOut} fullWidth style={styles.signOut} />
      </View>
    </Screen>
  );
}


const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.sm },
  loadingContainer: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.md },
  title: { marginTop: Spacing.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: Spacing.xs,
  },
  center: { textAlign: "center" },
  authActions: { alignSelf: "stretch", gap: Spacing.sm, marginTop: Spacing.md },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  section: { alignSelf: "stretch", marginTop: Spacing.lg },
  sectionLabel: { marginBottom: Spacing.xs, letterSpacing: 0.5 },
  valueList: { alignSelf: "stretch", marginTop: Spacing.xl, gap: 0 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.sm },
  groupedList: { borderRadius: Radius.lg, overflow: "hidden" },
  vendorModeButton: { marginTop: Spacing.sm },
  startSellingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.sm, borderWidth: 1 },
  groupedRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.sm },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  signOut: { marginTop: Spacing.xl, alignSelf: "stretch" },
});
