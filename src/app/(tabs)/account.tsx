import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Color, Radius, Spacing } from "@/constants/theme";

const UPCOMING: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "receipt-outline", label: "Orders" },
  { icon: "earth-outline", label: "Sourcing requests" },
  { icon: "heart-outline", label: "Saved products" },
  { icon: "chatbubble-ellipses-outline", label: "Messages" },
  { icon: "settings-outline", label: "Settings" },
];

/**
 * Signed-out Account shell (MOBILE_V1_PLAN.md §18): the route/tab exists
 * for navigation completeness, but native sign-in isn't built until
 * @better-auth/expo is validated in a later milestone — so this
 * deliberately doesn't offer a "Sign in" button that would do nothing.
 */
export default function AccountScreen() {
  return (
    <Screen surface="commerce">
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="person" size={34} color={Color.commerce.surface} />
        </View>

        <Text variant="h1" tone="onLight" style={styles.center}>
          Sign in to manage your account
        </Text>
        <Text variant="body" tone="onLightMuted" style={[styles.center, styles.body]}>
          Sign in to manage orders, sourcing requests, saved items and your CrownSourceGlobal profile.
        </Text>

        <View style={styles.comingSoonBadge}>
          <Text variant="caption" tone="goldOnLight">
            NATIVE SIGN-IN — COMING SOON
          </Text>
        </View>

        <View style={styles.list}>
          {UPCOMING.map((item) => (
            <View key={item.label} style={styles.listRow}>
              <View style={styles.listIcon}>
                <Ionicons name={item.icon} size={18} color={Color.commerce.textSecondary} />
              </View>
              <Text variant="body" tone="onLightMuted">
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
    backgroundColor: Color.commerce.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  center: { textAlign: "center" },
  body: { marginBottom: Spacing.xs },
  comingSoonBadge: {
    borderWidth: 1,
    borderColor: Color.gold,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  list: { alignSelf: "stretch", marginTop: Spacing.lg, gap: Spacing.sm },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Color.commerce.surface,
    borderWidth: 1,
    borderColor: Color.commerce.border,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Color.commerce.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
});
