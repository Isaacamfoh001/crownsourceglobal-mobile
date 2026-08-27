import { Pressable, StyleSheet, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { Text } from "./Text";

type SectionHeaderProps = {
  title: string;
  onPressAction?: () => void;
  actionLabel?: string;
};

export function SectionHeader({ title, onPressAction, actionLabel = "View all" }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text variant="sectionHeading" tone="primary">
        {title}
      </Text>
      {onPressAction && (
        <Pressable onPress={onPressAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${actionLabel}: ${title}`}>
          <Text variant="smallMedium" tone="pink">
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
