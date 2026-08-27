import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const STEPS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "create-outline", label: "Describe what you need" },
  { icon: "camera-outline", label: "Add reference photos" },
  { icon: "layers-outline", label: "Tell us the quantity" },
  { icon: "location-outline", label: "Share your destination" },
  { icon: "document-text-outline", label: "Receive a vendor quotation" },
];

/**
 * Source is a real Customer nav tab (MOBILE_V1_PLAN.md section 6.1) but
 * the sourcing/quotation API isn't part of scope yet (no POST
 * /api/v1/sourcing) -- this is an honest value-prop placeholder, not a
 * form that would silently do nothing on submit.
 */
export default function SourceScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.gold }]}>
          <Ionicons name="camera" size={32} color={colors.surface} />
        </View>

        <Text variant="screenTitle" tone="primary" style={styles.center}>
          Saw it somewhere? Snap or upload it.
        </Text>
        <Text variant="body" tone="secondary" style={[styles.center, styles.body]}>
          Screenshot a look from Instagram or TikTok, describe what you need, and CrownSourceGlobal will connect you
          with a vendor who can supply it &mdash; anywhere in the world.
        </Text>

        <View style={styles.stepList}>
          {STEPS.map((step) => (
            <View key={step.label} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: colors.goldSurface }]}>
                <Ionicons name={step.icon} size={18} color={colors.goldStrong} />
              </View>
              <Text variant="body" tone="primary">
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.comingSoonBadge, { borderColor: colors.borderPremium }]}>
          <Text variant="caption" tone="gold">
            NATIVE SOURCING -- COMING SOON
          </Text>
        </View>

        <Button label="Browse the marketplace instead" variant="outline" onPress={() => router.push("/(tabs)/shop")} style={styles.button} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  center: { textAlign: "center" },
  body: { marginBottom: Spacing.sm },
  stepList: { alignSelf: "stretch", gap: Spacing.sm, marginVertical: Spacing.md },
  stepRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  button: { marginTop: Spacing.sm },
});
