import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AppLogo } from "@/components/ui/AppLogo";
import { AuthScreenHeader } from "@/components/auth/AuthScreenHeader";
import { Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth/client";
import { friendlyAuthErrorMessage } from "@/lib/auth/errors";

const MIN_PASSWORD_LENGTH = 8;

/** Native email/password sign-up (M20.2 §8). Fields follow the backend's actual emailAndPassword requirements — name, email, password — audited from ../crownsourceglobal/lib/auth.ts, plus a client-only confirm-password check. */
export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError("Please fill in every field.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setError(friendlyAuthErrorMessage(signUpError));
        return;
      }

      router.replace({ pathname: "/(auth)/verify-email", params: { email: trimmedEmail } });
    } catch {
      setError("Could not reach the CrownSourceGlobal server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <AuthScreenHeader />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.container}>
          <AppLogo width={120} />
          <Text variant="screenTitle" tone="primary" style={styles.title}>
            Create your account
          </Text>
          <Text variant="body" tone="secondary" style={styles.subtitle}>
            Shop, source and manage orders with CrownSourceGlobal.
          </Text>

          <View style={styles.form}>
            <TextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" textContentType="name" returnKeyType="next" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="username"
              returnKeyType="next"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="next"
            />
            <TextField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />

            {error && (
              <Text variant="small" tone="error" accessibilityLiveRegion="polite">
                {error}
              </Text>
            )}

            <Button label="Create account" onPress={onSubmit} loading={submitting} fullWidth />
          </View>

          <View style={styles.footer}>
            <Text variant="body" tone="secondary">
              Already have an account?
            </Text>
            <Button label="Sign in" variant="ghost" onPress={() => router.replace("/(auth)/sign-in")} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.xxs },
  title: { marginTop: Spacing.md, textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: Spacing.md },
  form: { alignSelf: "stretch", gap: Spacing.md },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: Spacing.lg, gap: Spacing.xxs },
});
