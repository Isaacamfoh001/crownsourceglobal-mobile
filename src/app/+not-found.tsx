import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function NotFoundScreen() {
  const { colors } = useAppTheme();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text variant="screenTitle" tone="primary">
          Page not found
        </Text>
        <Text variant="body" tone="secondary" style={styles.center}>
          That screen does not exist.
        </Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text variant="bodyMedium" tone="pink">
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  center: { textAlign: "center" },
  link: { marginTop: Spacing.sm },
});
