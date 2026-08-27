import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  placeholder?: string;
  editable?: boolean;
};

/**
 * The one text-input primitive for auth (and future) forms — label, error
 * copy, and an optional password-reveal toggle, all theme-aware (M20.2
 * §22/§24/§25). Error state is conveyed by both the border color AND
 * explicit text, never color alone (§25).
 */
export function TextField({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType,
  autoComplete,
  textContentType,
  autoCapitalize = "none",
  returnKeyType,
  onSubmitEditing,
  placeholder,
  editable = true,
}: TextFieldProps) {
  const { colors } = useAppTheme();
  const [revealed, setRevealed] = useState(false);
  const isSecure = secureTextEntry && !revealed;

  return (
    <View style={styles.container}>
      <Text variant="smallMedium" tone="secondary">
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary }]}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          accessibilityLabel={label}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
          >
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="small" tone="error">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xxs },
  inputRow: {
    minHeight: TouchTarget,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.sm,
  },
});
