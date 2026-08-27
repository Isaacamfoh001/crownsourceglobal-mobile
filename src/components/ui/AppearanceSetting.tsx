import { Pressable, StyleSheet, View } from "react-native";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme, type ThemeMode } from "@/hooks/useAppTheme";
import { Text } from "./Text";

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "System" },
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
];

/** Appearance preference segmented control — System/Light/Dark. See useAppTheme.tsx for what "System" resolves to and the M19.2 report for why this isn't persisted to device storage yet. */
export function AppearanceSetting() {
  const { mode, setMode, colors } = useAppTheme();

  return (
    <View>
      <Text variant="smallMedium" tone="secondary" style={styles.label}>
        APPEARANCE
      </Text>
      <View style={[styles.row, { backgroundColor: colors.surfaceSubtle }]}>
        {OPTIONS.map((option) => {
          const selected = mode === option.mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => setMode(option.mode)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.segment, selected && { backgroundColor: colors.pink }]}
            >
              <Text variant="smallMedium" tone={selected ? "onAccent" : "secondary"}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: Spacing.xs, letterSpacing: 0.5 },
  row: { flexDirection: "row", borderRadius: Radius.pill, padding: 3, gap: 3 },
  segment: { flex: 1, alignItems: "center", paddingVertical: Spacing.xs, borderRadius: Radius.pill },
});
