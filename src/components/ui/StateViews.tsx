import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Color, IconSize, Spacing } from "@/constants/theme";
import { Button } from "./Button";
import { Text } from "./Text";

type StateViewProps = {
  title: string;
  message?: string;
  tone?: "onDark" | "onLight";
};

/** Shown when an API-backed screen fails to load — never a raw fetch/HTTP error string (MOBILE_V1_PLAN.md §36). */
export function ErrorState({ title = "Something went wrong", message, onRetry, tone = "onLight" }: StateViewProps & { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={IconSize.xl} color={tone === "onDark" ? Color.brand.textSecondary : Color.commerce.textMuted} />
      <Text variant="title" tone={tone === "onDark" ? "onDark" : "onLight"} style={styles.center}>
        {title}
      </Text>
      {message && (
        <Text variant="body" tone={tone === "onDark" ? "onDarkMuted" : "onLightMuted"} style={styles.center}>
          {message}
        </Text>
      )}
      <Button label="Try again" onPress={onRetry} variant={tone === "onDark" ? "darkOutline" : "lightOutline"} style={styles.button} />
    </View>
  );
}

export function EmptyState({ title, message, icon = "search-outline", tone = "onLight" }: StateViewProps & { icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={IconSize.xl} color={tone === "onDark" ? Color.brand.textSecondary : Color.commerce.textMuted} />
      <Text variant="title" tone={tone === "onDark" ? "onDark" : "onLight"} style={styles.center}>
        {title}
      </Text>
      {message && (
        <Text variant="body" tone={tone === "onDark" ? "onDarkMuted" : "onLightMuted"} style={styles.center}>
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
