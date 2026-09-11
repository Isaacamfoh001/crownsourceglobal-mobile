import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AppLogo } from "@/components/ui/AppLogo";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
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
 * Experience chooser (M32.3 §2, reopenable since M32.5.1). Two entry paths
 * share this one screen:
 *
 * - First run: `ExperienceGate` force-navigates here while `experience` is
 *   still null. Behavior here is untouched from M32.3 — choosing a
 *   commerce/service option just records intent and opens the normal app;
 *   onboarding never fires immediately, only later from Account.
 * - Reopened later ("Explore CrownSource experiences" in Account):
 *   `experience` is already non-null, since the gate above is the only way
 *   to reach this screen with it still null. In that case a choice acts
 *   immediately — entering the mode if the account already qualifies for
 *   it, else launching that mode's existing onboarding — matching what
 *   Switch Experience already does for modes the account has.
 */
export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  const { me } = useAuth();
  const { experience, setExperience, availableExperiences } = useExperience();
  const isReentry = experience !== null;
  const isVendor = Boolean(me?.vendor.available);

  function choose(option: (typeof OPTIONS)[number]) {
    if (!isReentry) {
      // First run (M32.3 §3), unchanged: record intent only, never gate on
      // eligibility, and Careers still defaults to "BUYER" so the chooser
      // never shows again.
      setExperience(option.experience ?? "BUYER");
      router.replace("/(tabs)");
      if (option.href) router.push(option.href as never);
      return;
    }

    if (option.href) {
      // Careers on reentry never touches the active experience — doing so
      // would silently switch the mode the person already had.
      router.push(option.href as never);
      return;
    }

    const mode = option.experience as ExperienceMode;

    if (mode === "BUYER") {
      setExperience(mode);
      router.replace("/(tabs)");
      return;
    }

    if (availableExperiences.includes(mode)) {
      setExperience(mode);
      router.replace("/(vendor)");
      return;
    }

    // Not yet eligible — send them into the same pathway-specific onboarding
    // Switch Experience already offers, without touching the active mode
    // (M32.6 — each pathway gets its own onboarding journey, never a
    // generic vendor gate).
    if (mode === "BEAUTY" && isVendor) {
      router.push("/vendor-beauty-professional");
    } else if (mode === "BEAUTY") {
      router.push({ pathname: "/vendor-onboarding", params: { type: "beauty" } });
    } else if (mode === "FACTORY" && isVendor) {
      // An approved Vendor gets the short M32.8 upgrade application, never
      // the first-time manufacturer wizard (M32.8.1 §1/§6).
      router.push("/manufacturer-upgrade");
    } else if (mode === "FACTORY") {
      router.push({ pathname: "/vendor-onboarding", params: { type: "manufacturer" } });
    } else {
      router.push({ pathname: "/vendor-onboarding", params: { type: "seller" } });
    }
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.header}>
        {isReentry && (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        )}
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
  header: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.xs, position: "relative" },
  closeButton: { position: "absolute", top: Spacing.xl, right: Spacing.xl, zIndex: 1 },
  title: { textAlign: "center", marginTop: Spacing.md },
  subtitle: { textAlign: "center" },
  list: { padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
});
