import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { IconSize, Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

type QuantityStepperProps = {
  quantity: number;
  min: number;
  max: number | null;
  onChange: (quantity: number) => void;
  /** Compact mode for use inside a Cart row (smaller touch targets, no min label). */
  compact?: boolean;
};

/**
 * Shared quantity stepper (M25) — Product Detail and Cart both need the
 * same MOQ/maxOq/availableQuantity-respecting +/- control. Clamped
 * entirely client-side for UX only; checkout/cart mutations always
 * re-validate server-side (CLAUDE.md §12), so this never needs to know
 * *why* a bound applies, only what it is.
 */
export function QuantityStepper({ quantity, min, max, onChange, compact = false }: QuantityStepperProps) {
  const { colors } = useAppTheme();
  const canDecrement = quantity > min;
  const canIncrement = max === null || quantity < max;
  const size = compact ? TouchTarget - 8 : TouchTarget;

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Pressable
        onPress={() => canDecrement && onChange(quantity - 1)}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        style={({ pressed }) => [styles.button, { width: size, height: size }, pressed && canDecrement && { backgroundColor: colors.surfaceSubtle }]}
      >
        <Ionicons name="remove" size={IconSize.md} color={canDecrement ? colors.textPrimary : colors.textMuted} />
      </Pressable>
      <Text variant="bodyMedium" tone="primary" style={styles.value}>
        {quantity}
      </Text>
      <Pressable
        onPress={() => canIncrement && onChange(quantity + 1)}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        style={({ pressed }) => [styles.button, { width: size, height: size }, pressed && canIncrement && { backgroundColor: colors.surfaceSubtle }]}
      >
        <Ionicons name="add" size={IconSize.md} color={canIncrement ? colors.textPrimary : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.xxs },
  button: { alignItems: "center", justifyContent: "center" },
  value: { minWidth: 28, textAlign: "center" },
});
