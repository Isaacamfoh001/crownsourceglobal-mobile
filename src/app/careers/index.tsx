import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const WHO_CAN_APPLY = [
  "Hairdressers",
  "Wig makers",
  "Wig installers",
  "Braiders",
  "Makeup artists",
  "Lash technicians",
  "Nail technicians",
  "Beauticians",
  "Salon assistants",
  "Beauty sales staff",
];

const HOW_IT_WORKS = [
  "Tell us who you are and what you do.",
  "Upload a few clear photos of work you personally completed.",
  "Submit — no account or sign-in required.",
];

/**
 * Careers / Talent Network landing (M23.2) — mirrors the existing web
 * `/careers` guest intake copy and structure exactly (CLAUDE.md M23.2 §17:
 * "Careers" already means Talent on web, no separate "Join Talent"
 * concept). "Show us your work" over a CV — see modules/talent/service.ts.
 */
export default function CareersLandingScreen() {
  const { scheme, colors } = useAppTheme();
  const heroColors = Palette.dark;

  return (
    <Screen edges={["top"]} contentStyle={styles.screenContent}>
      <View style={[styles.hero, { backgroundColor: heroColors.bg }, scheme === "light" && styles.heroLightSeam]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={heroColors.textPrimary} />
          </Pressable>
        </View>

        <Text variant="caption" style={{ color: heroColors.gold, letterSpacing: 1.5 }}>
          CAREERS
        </Text>
        <Text variant="display" style={[styles.heroTitle, { color: heroColors.textPrimary }]}>
          Your work speaks for you.
        </Text>
        <Text variant="body" style={{ color: heroColors.textSecondary, marginTop: Spacing.sm }}>
          Looking for opportunities in beauty? Show us what you can do, tell us the kind of work
          you&apos;re looking for, and CrownSourceGlobal may connect you with relevant opportunities.
        </Text>
        <Text variant="small" style={{ color: heroColors.textMuted, marginTop: Spacing.xs }}>
          No CV needed — just real photos of your work.
        </Text>

        <Button
          label="Start Application"
          onPress={() => router.push("/careers/apply")}
          fullWidth
          style={styles.heroCta}
        />
      </View>

      <View style={styles.section}>
        <Text variant="smallMedium" tone="gold" style={styles.eyebrow}>
          WHO CAN APPLY
        </Text>
        <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
          Beauty professionals of every kind
        </Text>
        <View style={styles.chipWrap}>
          {WHO_CAN_APPLY.map((role) => (
            <View key={role} style={[styles.roleChip, { backgroundColor: colors.surfaceSubtle }]}>
              <Text variant="small" tone="secondary">
                {role}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.howItWorks, { borderTopColor: colors.border }]}>
        <Text variant="sectionHeading" tone="primary">
          How it works
        </Text>
        <View style={styles.stepList}>
          {HOW_IT_WORKS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.pinkSurface }]}>
                <Text variant="smallMedium" tone="pink">
                  {index + 1}
                </Text>
              </View>
              <Text variant="body" tone="secondary" style={styles.stepText}>
                {step}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="small" tone="muted" style={styles.disclaimer}>
          CrownSourceGlobal may connect suitable applicants with relevant beauty opportunities.
          Submitting an application does not guarantee placement or employment.
        </Text>

        <Button label="Start Application" onPress={() => router.push("/careers/apply")} fullWidth style={styles.bottomCta} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: Spacing.xxl },
  hero: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xl },
  heroLightSeam: { borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  header: { flexDirection: "row", alignItems: "center", height: 40 },
  heroTitle: { marginTop: Spacing.sm },
  heroCta: { marginTop: Spacing.lg },

  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.xl },
  eyebrow: { letterSpacing: 1 },
  sectionTitle: { marginTop: Spacing.xxs },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginTop: Spacing.md },
  roleChip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs, borderRadius: Radius.pill },

  howItWorks: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.xl },
  stepList: { marginTop: Spacing.md, gap: Spacing.sm },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  stepBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepText: { flex: 1, marginTop: 2 },
  disclaimer: { marginTop: Spacing.lg },
  bottomCta: { marginTop: Spacing.lg },
});
