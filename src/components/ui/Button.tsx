import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from "react-native";
import { Color, Radius, Spacing, TouchTarget } from "@/constants/theme";
import { Text } from "./Text";

export type ButtonVariant = "pink" | "darkOutline" | "lightOutline" | "goldOutline" | "ghostOnDark" | "ghostOnLight";

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

const VARIANT_STYLE: Record<ButtonVariant, { bg: string; border?: string; textTone: Parameters<typeof Text>[0]["tone"] }> = {
  pink: { bg: Color.pink, textTone: "inverse" },
  darkOutline: { bg: "transparent", border: "rgba(255,255,255,0.35)", textTone: "onDark" },
  lightOutline: { bg: "transparent", border: Color.commerce.border, textTone: "onLight" },
  goldOutline: { bg: "transparent", border: Color.gold, textTone: "goldOnLight" },
  ghostOnDark: { bg: "rgba(255,255,255,0.08)", textTone: "onDark" },
  ghostOnLight: { bg: Color.commerce.surfaceSubtle, textTone: "onLight" },
};

/** The one tappable-button primitive. Pink = primary interaction everywhere (brand rule: gold never doubles as a CTA fill). */
export function Button({
  label,
  onPress,
  variant = "pink",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  accessibilityHint,
  style,
}: ButtonProps) {
  const v = VARIANT_STYLE[variant];
  const isPressableDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isPressableDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isPressableDisabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 },
        fullWidth && styles.fullWidth,
        isPressableDisabled && styles.disabled,
        pressed && !isPressableDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.textTone === "inverse" ? Color.inverseText : Color.pink} />
      ) : (
        <>
          {icon}
          <Text variant="bodyMedium" tone={v.textTone}>
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
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
