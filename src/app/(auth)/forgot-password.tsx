import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthScreenHeader } from "@/components/auth/AuthScreenHeader";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { authClient } from "@/lib/auth/client";
import { friendlyAuthErrorMessage } from "@/lib/auth/errors";

/**
 * Native "Forgot password" entry point (M20.2 §11). Reuses the existing
 * backend reset flow as-is — completion happens on the existing web
 * `/reset-password` page (already reachable from the emailed link) rather
 * than a new native reset system, per the milestone's explicit allowance.
 */
export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: requestError } = await authClient.requestPasswordReset({ email: trimmedEmail });

      if (requestError) {
        setError(friendlyAuthErrorMessage(requestError));
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach the CrownSourceGlobal server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Screen edges={["top", "bottom"]}>
        <AuthScreenHeader />
        <View style={styles.container}>
          <View style={[styles.iconCircle, { backgroundColor: colors.goldSurface }]}>
            <Ionicons name="mail-outline" size={34} color={colors.goldStrong} />
          </View>
          <Text variant="screenTitle" tone="primary" style={styles.center}>
            Check your email
          </Text>
          <Text variant="body" tone="secondary" style={[styles.center, styles.body]}>
            If an account exists for {email.trim()}, we sent a link to reset your password.
          </Text>
          <Button label="Back to sign in" onPress={() => router.replace("/(auth)/sign-in")} fullWidth style={styles.action} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <AuthScreenHeader />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.container}>
          <Text variant="screenTitle" tone="primary" style={styles.center}>
            Reset your password
          </Text>
          <Text variant="body" tone="secondary" style={[styles.center, styles.body]}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="username"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {error && (
              <Text variant="small" tone="error" accessibilityLiveRegion="polite">
                {error}
              </Text>
            )}
            <Button label="Send reset link" onPress={onSubmit} loading={submitting} fullWidth />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.md },
  iconCircle: { width: 72, height: 72, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  body: { marginBottom: Spacing.xs },
  form: { alignSelf: "stretch", gap: Spacing.md },
  action: { marginTop: Spacing.xs },
});
