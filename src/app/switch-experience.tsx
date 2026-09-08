import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useExperience } from "@/hooks/useExperience";
import type { ExperienceMode } from "@/types/api";

const LABELS: Record<ExperienceMode, { icon: keyof typeof Ionicons.glyphMap; label: string; description: string }> = {
  BUYER: { icon: "compass-outline", label: "Buy or source", description: "Shop and track sourcing requests" },
  SELLER: { icon: "storefront-outline", label: "Sell products", description: "Manage your store, products and orders" },
  FACTORY: { icon: "cube-outline", label: "Factory / manufacturer", description: "Respond to sourcing requests" },
  BEAUTY: { icon: "sparkles-outline", label: "Beauty services", description: "Manage services and requests" },
};

/**
 * Account → Switch experience (M32.3 §4/§18). Shows only experiences this
 * User can legitimately access right now, plus onboarding entries for
 * legitimate capabilities they don't have yet. Never signs out, never
 * creates another User, never touches auth — same session throughout.
 */
export default function SwitchExperienceScreen() {
  const { colors } = useAppTheme();
  const { me } = useAuth();
  const { experience, setExperience, availableExperiences } = useExperience();

  function choose(mode: ExperienceMode) {
    setExperience(mode);
    router.replace(mode === "BUYER" ? "/(tabs)" : "/(vendor)");
  }

  const isVendor = Boolean(me?.vendor.available);
  const hasBeautyProfile = me?.vendor.memberships.some((m) => m.beautyProfessional.available) ?? false;

  return (
    <Screen>
      <Text variant="screenTitle" tone="primary" style={styles.title}>
        Switch experience
      </Text>

      <View style={styles.section}>
        <View style={[styles.groupedList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {availableExperiences.map((mode, index) => (
            <Pressable
              key={mode}
              onPress={() => choose(mode)}
              style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
              accessibilityRole="button"
              accessibilityState={{ selected: experience === mode }}
            >
              <View style={[styles.icon, { backgroundColor: colors.goldSurface }]}>
                <Ionicons name={LABELS[mode].icon} size={18} color={colors.goldStrong} />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyMedium" tone="primary">
                  {LABELS[mode].label}
                </Text>
                <Text variant="small" tone="secondary">
                  {LABELS[mode].description}
                </Text>
              </View>
              {experience === mode ? <Ionicons name="checkmark-circle" size={20} color={colors.pink} /> : null}
            </Pressable>
          ))}
        </View>
      </View>

      {!isVendor ? (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            NOT YET SET UP
          </Text>
          <Pressable
            onPress={() => router.push("/vendor-onboarding")}
            style={[styles.groupedList, styles.onboardingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text variant="bodyMedium" tone="primary" style={styles.flex}>
              Start selling
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : !hasBeautyProfile ? (
        <View style={styles.section}>
          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            NOT YET SET UP
          </Text>
          <Pressable
            onPress={() => router.push("/vendor-beauty-professional")}
            style={[styles.groupedList, styles.onboardingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text variant="bodyMedium" tone="primary" style={styles.flex}>
              Become a beauty professional
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  section: { padding: Spacing.md },
  sectionLabel: { marginBottom: Spacing.xs, letterSpacing: 0.5 },
  groupedList: { borderWidth: 1, borderRadius: Radius.lg, overflow: "hidden" },
  onboardingRow: { flexDirection: "row", alignItems: "center", padding: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
});
