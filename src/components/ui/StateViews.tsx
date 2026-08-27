import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { IconSize, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Button } from "./Button";
import { Text } from "./Text";

type StateViewProps = {
  title: string;
  message?: string;
};

/** Shown when an API-backed screen fails to load — never a raw fetch/HTTP error string (MOBILE_V1_PLAN.md §36). */
export function ErrorState({ title = "Something went wrong", message, onRetry }: StateViewProps & { onRetry: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={IconSize.xl} color={colors.textMuted} />
      <Text variant="sectionHeading" tone="primary" style={styles.center}>
        {title}
      </Text>
      {message && (
        <Text variant="body" tone="secondary" style={styles.center}>
          {message}
        </Text>
      )}
      <Button label="Try again" onPress={onRetry} variant="outline" style={styles.button} />
    </View>
  );
}

export function EmptyState({ title, message, icon = "search-outline" }: StateViewProps & { icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={IconSize.xl} color={colors.textMuted} />
      <Text variant="sectionHeading" tone="primary" style={styles.center}>
        {title}
      </Text>
      {message && (
        <Text variant="body" tone="secondary" style={styles.center}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: Spacing.xs },
  center: { textAlign: "center" },
  button: { marginTop: Spacing.sm },
});
