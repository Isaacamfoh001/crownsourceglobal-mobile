import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AppLogo } from "@/components/ui/AppLogo";
import { AuthScreenHeader } from "@/components/auth/AuthScreenHeader";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { authClient } from "@/lib/auth/client";
import { friendlyAuthErrorMessage, isEmailNotVerifiedError } from "@/lib/auth/errors";

/** Native email/password + Google sign-in (M20.2 §10). */
export default function SignInScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const goToDestination = () => {
    const destination = (params.redirect as Href) || "/(tabs)/account";
    router.replace(destination);
  };

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    setUnverifiedEmail(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: signInError } = await authClient.signIn.email({ email: trimmedEmail, password });

      if (signInError) {
        if (isEmailNotVerifiedError(signInError)) {
          setUnverifiedEmail(trimmedEmail);
          setError("Please verify your email before signing in.");
          return;
        }
        setError(friendlyAuthErrorMessage(signInError));
        return;
      }

      goToDestination();
    } catch {
      setError("Could not reach the CrownSourceGlobal server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    if (googleSubmitting) return;
    setError(null);
    setGoogleSubmitting(true);
    try {
      const { error: googleError } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (googleError) {
        setError(friendlyAuthErrorMessage(googleError));
      }
      // A successful native Google sign-in resolves the shared session store
      // directly (see src/lib/auth/client.ts) — the root layout/tabs re-render
      // signed-in on their own, no manual navigation needed here.
    } catch {
      setError("Could not reach the CrownSourceGlobal server. Check your connection and try again.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <AuthScreenHeader />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.container}>
          <AppLogo width={120} />
          <Text variant="screenTitle" tone="primary" style={styles.title}>
            Welcome back
          </Text>
          <Text variant="body" tone="secondary" style={styles.subtitle}>
            Sign in to manage orders, sourcing requests and your CrownSourceGlobal profile.
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
              returnKeyType="next"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />

            {error && (
              <Text variant="small" tone="error" accessibilityLiveRegion="polite">
                {error}
              </Text>
            )}

            {unverifiedEmail && (
              <Button
                label="Resend verification email"
                variant="outline"
                onPress={() => router.push({ pathname: "/(auth)/verify-email", params: { email: unverifiedEmail } })}
              />
            )}

            <Button
              label="Forgot password?"
              variant="ghost"
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotButton}
            />

            <Button label="Sign in" onPress={onSubmit} loading={submitting} disabled={googleSubmitting} fullWidth />

            <View style={[styles.divider, { borderColor: colors.border }]} />

            <Button
              label="Continue with Google"
              variant="outline"
              onPress={onGoogleSignIn}
              loading={googleSubmitting}
              disabled={submitting}
              fullWidth
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" tone="secondary">
              New to CrownSourceGlobal?
            </Text>
            <Button label="Create account" variant="ghost" onPress={() => router.replace("/(auth)/sign-up")} />
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
  forgotButton: { alignSelf: "flex-end", paddingHorizontal: 0 },
  divider: { borderTopWidth: 1, marginVertical: Spacing.xxs },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: Spacing.lg, gap: Spacing.xxs },
});
