import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { Type, type ThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

export type TextVariant = keyof typeof Type;

/**
 * Semantic tones only — no "onLight"/"onDark" split. The same tone resolves
 * to the correct color under whichever theme is active (see useAppTheme),
 * which is the whole point of M19.2's theme system: a component never
 * needs to know which theme it's in.
 */
export type TextTone =
  | "primary"
  | "secondary"
  | "muted"
  | "pink"
  | "gold"
  | "success"
  | "warning"
  | "error"
  /** Always light — for text over a scrim/photo, independent of theme. */
  | "inverse"
  /** Text/icons placed on top of a `pink`-filled surface (e.g. a primary button label). */
  | "onAccent";

function toneColor(tone: TextTone, colors: ThemeColors): string {
  switch (tone) {
    case "primary":
      return colors.textPrimary;
    case "secondary":
      return colors.textSecondary;
    case "muted":
      return colors.textMuted;
    case "pink":
      return colors.pink;
    case "gold":
      return colors.goldStrong;
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "error":
      return colors.error;
    case "inverse":
      return colors.textInverse;
    case "onAccent":
      return colors.textOnAccent;
  }
}

export type TextComponentProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

/** The one Text primitive every screen should use — carries the type scale and semantic color tokens so no screen hardcodes a font size or hex value. */
export function Text({ variant = "body", tone = "primary", style, ...rest }: TextComponentProps) {
  const { colors } = useAppTheme();
  return <RNText style={[Type[variant], { color: toneColor(tone, colors) }, style]} {...rest} />;
}
