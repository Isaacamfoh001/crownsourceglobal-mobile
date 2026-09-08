import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./Text";
import { Button } from "./Button";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

/**
 * A quiet, premium "request received" confirmation (M32.3 §11/§19) — a
 * bottom sheet with a single calm confirmation and exactly the two actions
 * the moment calls for, replacing a bare native `Alert.alert`. Not a
 * general-purpose modal: built for the one "you just submitted something"
 * moment, reused wherever that shape fits.
 */
export function SuccessSheet({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSecondary}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onSecondary} accessibilityLabel="Dismiss" />
        <SafeAreaView edges={["bottom"]} style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.goldSurface }]}>
            <Ionicons name="checkmark" size={28} color={colors.goldStrong} />
          </View>
          <Text variant="screenTitle" tone="primary" style={styles.center}>
            {title}
          </Text>
          <Text variant="body" tone="secondary" style={styles.center}>
            {message}
          </Text>
          <Button label={primaryLabel} onPress={onPrimary} fullWidth style={styles.primaryButton} />
          <Button label={secondaryLabel} variant="outline" onPress={onSecondary} fullWidth />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20,16,24,0.45)" },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: Spacing.xs },
  center: { textAlign: "center" },
  primaryButton: { marginTop: Spacing.md },
});
