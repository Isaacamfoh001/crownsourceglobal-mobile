import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from "react-native";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text, type TextTone } from "./Text";

export type ButtonVariant = "pink" | "outline" | "ghost" | "goldOutline";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  accessibilityHint?: string;
  style?: ViewStyle;
};

/** The one tappable-button primitive. Pink = primary interaction everywhere (brand rule: gold never doubles as a CTA fill). */
export function Button({ label, onPress, variant = "pink", disabled = false, loading = false, fullWidth = false, icon, accessibilityHint, style }: ButtonProps) {
  const { colors } = useAppTheme();
  const isPressableDisabled = disabled || loading;

  const restBg = variant === "pink" ? colors.pink : "transparent";
  const pressedBg = variant === "pink" ? colors.pinkPressed : variant === "ghost" ? colors.surfaceSubtle : "transparent";
  const border = variant === "outline" ? colors.border : variant === "goldOutline" ? colors.gold : undefined;
  const textTone: TextTone = variant === "pink" ? "onAccent" : variant === "goldOutline" ? "gold" : "primary";
  const spinnerColor = variant === "pink" ? colors.textOnAccent : colors.pink;

  return (
    <Pressable
      onPress={onPress}
      disabled={isPressableDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isPressableDisabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isPressableDisabled ? pressedBg : variant === "ghost" ? colors.surfaceSubtle : restBg,
          borderColor: border,
          borderWidth: border ? 1 : 0,
        },
        fullWidth && styles.fullWidth,
        isPressableDisabled && styles.disabled,
        pressed && !isPressableDisabled && styles.pressedScale,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {icon}
          <Text variant="bodyMedium" tone={textTone}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TouchTarget,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.45 },
  pressedScale: { transform: [{ scale: 0.98 }] },
});
