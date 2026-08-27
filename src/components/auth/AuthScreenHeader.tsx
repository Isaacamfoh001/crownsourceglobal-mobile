import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { IconButton } from "@/components/ui/IconButton";
import { Spacing } from "@/constants/theme";

/** Shared top-of-screen close affordance for every (auth) route — avoids repeating the same row on sign-in/sign-up/verify-email/forgot-password. */
export function AuthScreenHeader() {
  return (
    <View style={styles.row}>
      <IconButton
        name="close"
        accessibilityLabel="Close"
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
});
