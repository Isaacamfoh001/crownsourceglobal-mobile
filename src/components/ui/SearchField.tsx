import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { Color, IconSize, Radius, Spacing, TouchTarget } from "@/constants/theme";

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  tone?: "onDark" | "onLight";
  onSubmitEditing?: () => void;
  editable?: boolean;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = "Search products, vendors…",
  tone = "onLight",
  onSubmitEditing,
  editable = true,
}: SearchFieldProps) {
  const onDark = tone === "onDark";
  const bg = onDark ? "rgba(255,255,255,0.10)" : Color.commerce.surface;
  const borderColor = onDark ? "rgba(255,255,255,0.16)" : Color.commerce.border;
  const textColor = onDark ? Color.brand.textPrimary : Color.commerce.textPrimary;
  const placeholderColor = onDark ? Color.brand.textSecondary : Color.commerce.textMuted;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor }]}>
      <Ionicons name="search" size={IconSize.md} color={placeholderColor} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        style={[styles.input, { color: textColor }]}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        editable={editable}
        accessibilityLabel={placeholder}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: TouchTarget,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
