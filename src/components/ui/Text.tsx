import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { Color, Type } from "@/constants/theme";

export type TextVariant = keyof typeof Type;

export type TextTone =
  | "onDark"
  | "onDarkMuted"
  | "onLight"
  | "onLightMuted"
  | "onLightFaint"
  | "goldOnDark"
  | "goldOnLight"
  | "pink"
  | "inverse"
  | "success"
  | "warning"
  | "error";

function toneColor(tone: TextTone): string {
  switch (tone) {
    case "onDark":
      return Color.brand.textPrimary;
    case "onDarkMuted":
      return Color.brand.textSecondary;
    case "onLight":
      return Color.commerce.textPrimary;
    case "onLightMuted":
      return Color.commerce.textSecondary;
    case "onLightFaint":
      return Color.commerce.textMuted;
    case "goldOnDark":
      return Color.goldOnDark;
    case "goldOnLight":
      return Color.goldStrong;
    case "pink":
      return Color.pink;
    case "inverse":
      return Color.inverseText;
    case "success":
      return Color.success;
    case "warning":
      return Color.warning;
    case "error":
      return Color.error;
  }
}

export type TextComponentProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

/** The one Text primitive every screen should use — carries the type scale and semantic color tokens so no screen hardcodes a font size or hex value. */
export function Text({ variant = "body", tone = "onLight", style, ...rest }: TextComponentProps) {
  return <RNText style={[Type[variant], { color: toneColor(tone) }, style]} {...rest} />;
}
