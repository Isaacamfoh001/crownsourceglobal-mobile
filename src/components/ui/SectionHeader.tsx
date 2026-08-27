import { Pressable, StyleSheet, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { Text, type TextTone } from "./Text";

type SectionHeaderProps = {
  title: string;
  onPressAction?: () => void;
  actionLabel?: string;
  tone?: "onDark" | "onLight";
};

export function SectionHeader({ title, onPressAction, actionLabel = "View all", tone = "onLight" }: SectionHeaderProps) {
  const titleTone: TextTone = tone === "onDark" ? "onDark" : "onLight";
  const actionTone: TextTone = tone === "onDark" ? "goldOnDark" : "pink";

  return (
    <View style={styles.row}>
      <Text variant="h2" tone={titleTone}>
        {title}
      </Text>
      {onPressAction && (
        <Pressable onPress={onPressAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${actionLabel}: ${title}`}>
          <Text variant="smallMedium" tone={actionTone}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
