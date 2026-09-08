import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AppLogo } from "@/components/ui/AppLogo";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useExperience } from "@/hooks/useExperience";
import type { ExperienceMode } from "@/types/api";

const OPTIONS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  experience?: ExperienceMode;
  href?: string;
}[] = [
  { icon: "compass-outline", label: "Buy or source products", description: "Shop the marketplace, or ask us to find something specific.", experience: "BUYER" },
  { icon: "storefront-outline", label: "Sell products", description: "Apply to list and sell on CrownSourceGlobal.", experience: "SELLER" },
  { icon: "cube-outline", label: "Supply as a factory or manufacturer", description: "Respond to sourcing requests we send you.", experience: "FACTORY" },
  { icon: "sparkles-outline", label: "Offer beauty services", description: "List your services and take booking requests.", experience: "BEAUTY" },
  { icon: "briefcase-outline", label: "Apply to work with CrownSourceGlobal", description: "Show us your work — no CV needed.", href: "/careers" },
];

/**
 * First-run experience chooser (M32.3 §2) — asks, once, what the person
 * came to do, then gets out of the way. Selecting a commerce/service
 * option just records intent and opens the normal app; it never gates
 * discovery or forces sign-in (§3) — the matching onboarding (Vendor
 * application, Beauty Professional application) only ever runs later, from
 * Account, when the person actually chooses to act on it.
 */
export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  const { setExperience } = useExperience();

  function choose(option: (typeof OPTIONS)[number]) {
    // Careers has no persistent experience (M32.3 §9) — "BUYER" is the
    // implicit default so the chooser never shows again, without biasing
    // any later Vendor/Beauty eligibility.
    setExperience(option.experience ?? "BUYER");
    router.replace("/(tabs)");
    if (option.href) router.push(option.href as never);
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.header}>
        <AppLogo width={72} />
        <Text variant="screenTitle" tone="primary" style={styles.title}>
          What would you like to do?
        </Text>
        <Text variant="body" tone="secondary" style={styles.subtitle}>
          You can always switch or add to this later from Account.
        </Text>
      </View>

      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            onPress={() => choose(option)}
            style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityRole="button"
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.goldSurface }]}>
              <Ionicons name={option.icon} size={20} color={colors.goldStrong} />
            </View>
            <View style={styles.flex}>
              <Text variant="bodyMedium" tone="primary">
                {option.label}
              </Text>
              <Text variant="small" tone="secondary">
                {option.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.xs },
  title: { textAlign: "center", marginTop: Spacing.md },
  subtitle: { textAlign: "center" },
  list: { padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
});
