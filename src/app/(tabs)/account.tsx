import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AppearanceSetting } from "@/components/ui/AppearanceSetting";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const UPCOMING: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "receipt-outline", label: "Orders" },
  { icon: "earth-outline", label: "Sourcing requests" },
  { icon: "heart-outline", label: "Saved products" },
  { icon: "chatbubble-ellipses-outline", label: "Messages" },
];

/**
 * Signed-out Account shell (MOBILE_V1_PLAN.md §18): the route/tab exists
 * for navigation completeness, but native sign-in isn't built until
 * @better-auth/expo is validated in a later milestone — so this
 * deliberately doesn't offer a "Sign in" button that would do nothing.
 * Appearance is real, local-only, and works today regardless of sign-in.
 */
export default function AccountScreen() {
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

        <View style={[styles.comingSoonBadge, { borderColor: colors.gold }]}>
          <Text variant="caption" tone="gold">
            NATIVE SIGN-IN — COMING SOON
          </Text>
        </View>

        <View style={styles.section}>
          <AppearanceSetting />
        </View>

        <View style={styles.list}>
          {UPCOMING.map((item) => (
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

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.md },
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
  comingSoonBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  section: { alignSelf: "stretch", marginTop: Spacing.lg },
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
});
