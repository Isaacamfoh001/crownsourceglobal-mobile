import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { AuthScreenHeader } from "@/components/auth/AuthScreenHeader";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { authClient } from "@/lib/auth/client";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * "Check your email" state after sign-up (M20.2 §9). Verification itself
 * happens on the existing web `/verify-email` page — deliberately NOT
 * deep-linked back into the app: the web page's own `redirect` param is
 * passed through `lib/safe-redirect.ts`, which only allows internal paths
 * and would reject a `crownsourceglobal://` scheme (an intentional
 * anti-open-redirect boundary, not an oversight) — see the M20.2 report.
 * Once verified, the user returns here on their own and signs in natively.
 */
export default function VerifyEmailScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? null;

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onResend = async () => {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    setNotice(null);
    try {
      const { error } = await authClient.sendVerificationEmail({ email });
      setNotice(error ? "Couldn't resend right now. Please try again shortly." : "Verification email sent.");
    } catch {
      setNotice("Couldn't resend right now. Please try again shortly.");
    } finally {
      setResending(false);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

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
          {email
            ? `We sent a verification link to ${email}. Open it to activate your account, then come back and sign in.`
            : "We sent you a verification link. Open it to activate your account, then come back and sign in."}
        </Text>

        {notice && (
          <Text variant="small" tone="secondary" style={styles.center} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        )}

        {email && (
          <Button
            label={cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
            variant="outline"
            onPress={onResend}
            loading={resending}
            disabled={cooldown > 0}
            fullWidth
            style={styles.action}
          />
        )}

        <Button label="Back to sign in" onPress={() => router.replace("/(auth)/sign-in")} fullWidth style={styles.action} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.md },
  iconCircle: { width: 72, height: 72, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  body: { marginBottom: Spacing.xs },
  action: { marginTop: Spacing.xs },
});
