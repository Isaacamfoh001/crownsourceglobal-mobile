import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Color, Spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text variant="h1" tone="onLight">
          Page not found
        </Text>
        <Text variant="body" tone="onLightMuted" style={styles.center}>
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
    backgroundColor: Color.commerce.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  center: { textAlign: "center" },
  link: { marginTop: Spacing.sm },
});
