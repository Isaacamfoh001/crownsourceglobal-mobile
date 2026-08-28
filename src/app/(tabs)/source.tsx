import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const STEPS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "camera-outline", label: "Photo" },
  { icon: "create-outline", label: "Details" },
  { icon: "document-text-outline", label: "Quote" },
];

/**
 * Source is a real Customer nav tab (MOBILE_V1_PLAN.md section 6.1) but
 * the sourcing/quotation API isn't part of scope yet (no POST
 * /api/v1/sourcing) — an honest, product-shaped preview rather than a
 * form that would silently do nothing on submit (M22.2 §19: no giant
 * "COMING SOON" slide, no functional camera capture that goes nowhere).
 */
export default function SourceScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text variant="smallMedium" tone="gold" style={styles.eyebrow}>
          SOURCE
        </Text>
        <Text variant="screenTitle" tone="primary">
          Show us what you want
        </Text>
        <Text variant="body" tone="secondary" style={styles.subtitle}>
          Snap a look you love and we&apos;ll match it to a vendor.
        </Text>
      </View>

      <View style={[styles.captureCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderPremium }]}>
        <View style={[styles.captureIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name="camera" size={26} color={colors.gold} />
        </View>
        <Text variant="bodyMedium" tone="secondary" style={styles.captureLabel}>
          Photo sourcing
        </Text>
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => (
          <View key={step.label} style={styles.stepItem}>
            <View style={styles.stepInline}>
              <View style={[styles.stepIcon, { backgroundColor: colors.goldSurface }]}>
                <Ionicons name={step.icon} size={16} color={colors.goldStrong} />
              </View>
              <Text variant="small" tone="secondary">
                {step.label}
              </Text>
            </View>
            {index < STEPS.length - 1 && <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={styles.stepArrow} />}
          </View>
        ))}
      </View>

      <Button label="Browse the marketplace" onPress={() => router.push("/(tabs)/shop")} fullWidth style={styles.button} />
      <Text variant="small" tone="muted" style={styles.footnote}>
        Native sourcing submissions are coming soon.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl },
  header: { alignItems: "center", gap: 2 },
  eyebrow: { letterSpacing: 1.2 },
  subtitle: { textAlign: "center", marginTop: Spacing.xxs },
  captureCard: {
    marginTop: Spacing.xl,
    alignSelf: "stretch",
    aspectRatio: 1.5,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  captureIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  captureLabel: {},
  stepsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: Spacing.xl },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepInline: { alignItems: "center", gap: 6 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepArrow: { marginHorizontal: Spacing.sm },
  button: { marginTop: Spacing.xxl, alignSelf: "stretch" },
  footnote: { textAlign: "center", marginTop: Spacing.sm },
});
