import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useOrderSummary } from "@/features/orders/useOrderSummary";
import { useInitiateMobileMoneyPayment, useSubmitMobileMoneyOtp, useInitiateCardPayment, usePaymentStatus } from "@/features/payments/usePayments";
import { MobileMoneyNetworkBadge } from "@/components/ui/MobileMoneyNetworkBadge";
import type { MobileMoneyNetworkCode, PaymentStatusDTO } from "@/types/api";

const POLL_INTERVAL_MS = 4_000;
const MAX_POLLS = 30; // ~2 minutes of bounded polling, same ceiling as web

type Method = "mobile-money" | "card";

/**
 * Native payment (M25) — Mobile Money (native OTP form) and Card
 * (Paystack-hosted Checkout via an in-app browser). Neither path collects
 * or stores card details on-device. Closing the browser or seeing a
 * "pending" state is never treated as proof of payment — the screen only
 * ever advances to confirmation on a SUCCEEDED status read back from
 * `GET /api/v1/payments/:id`, which independently re-verifies against the
 * provider server-side (see that route's doc comment). Paystack's own
 * webhook remains authoritative regardless of what this screen shows.
 */
export default function PaymentScreen() {
  const { colors } = useAppTheme();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const orderQuery = useOrderSummary(orderId);
  const [method, setMethod] = useState<Method>("mobile-money");

  const order = orderQuery.data;

  useEffect(() => {
    if (!order) return;
    if (order.status === "CONFIRMED") {
      router.replace({ pathname: "/checkout/[orderId]/confirmation", params: { orderId: order.id } });
    }
  }, [order]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text variant="sectionHeading" tone="primary">
          Payment
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {orderQuery.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={80} radius={Radius.lg} />
          <Skeleton height={160} radius={Radius.lg} style={styles.gap} />
        </View>
      )}

      {orderQuery.isError && <ErrorState title="Couldn't load this order" message={friendlyErrorMessage(orderQuery.error)} onRetry={() => orderQuery.refetch()} />}

      {order && order.status === "PENDING_PAYMENT" && (
        <View style={styles.content}>
          <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="small" tone="muted">
              Order {order.orderNumber}
            </Text>
            <Text variant="priceLarge" tone="pink" style={styles.totalValue}>
              {formatMoney({ amount: order.total.toFixed(2), currency: order.currency })}
            </Text>
          </View>

          <View style={[styles.tabRow, { borderColor: colors.border }]}>
            <Pressable onPress={() => setMethod("mobile-money")} style={[styles.tab, method === "mobile-money" && { backgroundColor: colors.pink }]} accessibilityRole="button">
              <Ionicons name="phone-portrait-outline" size={16} color={method === "mobile-money" ? colors.textOnAccent : colors.textSecondary} />
              <Text variant="bodyMedium" tone={method === "mobile-money" ? "onAccent" : "secondary"}>
                Mobile Money
              </Text>
            </Pressable>
            <Pressable onPress={() => setMethod("card")} style={[styles.tab, method === "card" && { backgroundColor: colors.pink }]} accessibilityRole="button">
              <Ionicons name="card-outline" size={16} color={method === "card" ? colors.textOnAccent : colors.textSecondary} />
              <Text variant="bodyMedium" tone={method === "card" ? "onAccent" : "secondary"}>
                Card
              </Text>
            </Pressable>
          </View>

          {method === "mobile-money" ? <MobileMoneyPanel orderId={order.id} /> : <CardPanel orderId={order.id} />}
        </View>
      )}

      {order && order.status !== "PENDING_PAYMENT" && order.status !== "CONFIRMED" && (
        <ErrorState title="This order can no longer be paid" message={`Current status: ${order.status}.`} onRetry={() => orderQuery.refetch()} />
      )}
    </SafeAreaView>
  );
}

const STALL_AFTER_MS = POLL_INTERVAL_MS * MAX_POLLS; // ~2 minutes, same ceiling as web

function isTerminalStatus(status: PaymentStatusDTO["status"] | undefined): boolean {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED";
}

/**
 * Terminal state shared by both payment panels — success routes to
 * confirmation, failure/cancel offers retry, "stalled" offers a manual
 * check. `seededPayment` holds the latest INITIATE/OTP-submit response;
 * once the status poll has its own data, that takes over as the displayed
 * `payment` (derived, not copied into state via an effect —
 * https://react.dev/learn/you-might-not-need-an-effect). Whether to keep
 * polling is decided INSIDE `refetchInterval`'s function form (reading
 * `query.state.data` directly, via `pollingEnabledRef`/`pollingStartedAt`
 * refs) rather than via a `setState` call inside an effect — that's what
 * lets the poll stop itself on a terminal/stalled outcome without ever
 * triggering React's "avoid setState synchronously in an effect" warning.
 * The one remaining effect below has no setState in it at all — it's a
 * pure navigation side effect.
 */
function usePaymentPolling(orderId: string, initial: PaymentStatusDTO | null) {
  const [seededPayment, setSeededPayment] = useState<PaymentStatusDTO | null>(initial);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [stalled, setStalled] = useState(false);
  const pollingEnabledRef = useRef(false);
  const pollingStartedAt = useRef(0);

  const statusQuery = usePaymentStatus(seededPayment?.paymentId, {
    // This callback is invoked by TanStack Query's own scheduler, never
    // during React's render pass — Date.now()/ref reads and the setStalled
    // call below are all fine here for the same reason they'd be fine in a
    // setTimeout callback or event handler, just not inline in render.
    refetchInterval: (query) => {
      if (!pollingEnabledRef.current) return false;
      if (isTerminalStatus(query.state.data?.status)) return false;
      if (Date.now() - pollingStartedAt.current > STALL_AFTER_MS) {
        setStalled(true);
        return false;
      }
      return POLL_INTERVAL_MS;
    },
  });

  const payment = statusQuery.data ?? seededPayment;
  const isTerminal = isTerminalStatus(payment?.status);
  const polling = pollingEnabled && !isTerminal && !stalled;

  useEffect(() => {
    if (payment?.status === "SUCCEEDED") {
      router.replace({ pathname: "/checkout/[orderId]/confirmation", params: { orderId } });
    }
  }, [payment?.status, orderId]);

  function startPolling(initialPayment: PaymentStatusDTO) {
    pollingStartedAt.current = Date.now();
    pollingEnabledRef.current = true;
    setStalled(false);
    setSeededPayment(initialPayment);
    setPollingEnabled(true);
  }

  /** Records a payment (e.g. an OTP-required attempt) without starting the refetch interval — the OTP step is a form, not something to poll while it's showing. */
  function seedPayment(initialPayment: PaymentStatusDTO) {
    setSeededPayment(initialPayment);
  }

  function checkNow() {
    statusQuery.refetch();
  }

  /** Clears the terminal FAILED/CANCELLED state so "Try again" actually returns to the form. */
  function reset() {
    pollingEnabledRef.current = false;
    setPollingEnabled(false);
    setStalled(false);
    setSeededPayment(null);
  }

  return { payment, polling, stalled, startPolling, seedPayment, checkNow, reset, isChecking: statusQuery.isFetching };
}

function MobileMoneyPanel({ orderId }: { orderId: string }) {
  const { colors } = useAppTheme();
  const initiate = useInitiateMobileMoneyPayment(orderId);
  const submitOtp = useSubmitMobileMoneyOtp(orderId);
  const { payment, polling, stalled, startPolling, seedPayment, checkNow, reset, isChecking } = usePaymentPolling(orderId, null);

  const [network, setNetwork] = useState<MobileMoneyNetworkCode>("MTN");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");

  const terminalFailed = payment?.status === "FAILED" || payment?.status === "CANCELLED";

  function handleInitiate() {
    initiate.mutate(
      { network, phone },
      {
        onSuccess: (result) => {
          if (result.status === "FAILED") {
            seedPayment(result);
            return;
          }
          if (result.requiresOtp) {
            seedPayment(result);
            setStep("otp");
          } else {
            startPolling(result);
          }
        },
      },
    );
  }

  function handleOtpSubmit() {
    if (!initiate.data) return;
    submitOtp.mutate(
      { paymentId: initiate.data.paymentId, phone, otpcode: otp },
      {
        onSuccess: (result) => {
          if (result.status !== "FAILED") startPolling(result);
        },
      },
    );
  }

  if (step === "otp" && !polling && !terminalFailed) {
    return (
      <View style={styles.panel}>
        <Text variant="body" tone="secondary">
          Enter the verification code sent to your phone via SMS to authorize this payment.
        </Text>
        {submitOtp.isError && (
          <Text variant="small" tone="error">
            {friendlyErrorMessage(submitOtp.error)}
          </Text>
        )}
        <TextInput
          value={otp}
          onChangeText={setOtp}
          placeholder="Verification code"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          autoFocus
          style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
        />
        <Button label={submitOtp.isPending ? "Verifying…" : "Confirm code"} onPress={handleOtpSubmit} disabled={submitOtp.isPending || !otp.trim()} loading={submitOtp.isPending} fullWidth />
      </View>
    );
  }

  if (polling || stalled) {
    return (
      <View style={[styles.panel, styles.centered]}>
        <ActivityIndicator color={colors.pink} />
        <Text variant="bodyMedium" tone="primary" style={styles.centerText}>
          {stalled ? "This is taking longer than expected." : payment?.providerStatus === "TP17" ? "Verification successful. Confirming your payment." : "Check your phone and approve the payment prompt."}
        </Text>
        {payment?.phoneMasked && (
          <Text variant="small" tone="muted">
            Sent to {payment.phoneMasked}
          </Text>
        )}
        <Pressable onPress={checkNow} disabled={isChecking} accessibilityRole="button" style={styles.checkNowButton}>
          <Text variant="small" tone="pink">
            {isChecking ? "Checking…" : "Check now"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (terminalFailed) {
    return (
      <View style={styles.panel}>
        <Text variant="small" tone="error">
          {payment?.failureReasonSafe ?? "Payment could not be completed."}
        </Text>
        <Button
          label="Try again"
          onPress={() => {
            reset();
            setStep("form");
          }}
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      {initiate.isError && (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(initiate.error)}
        </Text>
      )}
      <View style={styles.networkRow}>
        {(["MTN", "TELECEL", "AT"] as const).map((code) => (
          <Pressable
            key={code}
            onPress={() => setNetwork(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: network === code }}
            style={[
              styles.networkOption,
              { borderColor: colors.border, backgroundColor: colors.surface },
              network === code && { borderColor: colors.pink, backgroundColor: colors.pinkSurface },
            ]}
          >
            <MobileMoneyNetworkBadge network={code} />
            <Text variant="small" tone={network === code ? "pink" : "secondary"} style={styles.networkLabel}>
              {code === "MTN" ? "MTN" : code === "TELECEL" ? "Telecel" : "AirtelTigo"}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Mobile Money number"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
      />
      <Button label={initiate.isPending ? "Starting payment…" : "Pay with Mobile Money"} onPress={handleInitiate} disabled={initiate.isPending || phone.trim().length < 9} loading={initiate.isPending} fullWidth />
    </View>
  );
}

function CardPanel({ orderId }: { orderId: string }) {
  const { colors } = useAppTheme();
  const initiate = useInitiateCardPayment(orderId);
  const { payment, polling, stalled, startPolling, checkNow, reset, isChecking } = usePaymentPolling(orderId, null);

  const terminalFailed = payment?.status === "FAILED" || payment?.status === "CANCELLED";

  async function handlePay() {
    initiate.mutate(undefined, {
      onSuccess: async (result) => {
        if (result.authorizationUrl) {
          await WebBrowser.openBrowserAsync(result.authorizationUrl);
          // The in-app browser tab doesn't share the native app's session,
          // so its own landing page is never trusted — always independently
          // re-verify via our own poll after it's dismissed.
          startPolling(result.payment);
        } else {
          // Resuming an already-active attempt.
          startPolling(result.payment);
        }
      },
    });
  }

  if (polling || stalled) {
    return (
      <View style={[styles.panel, styles.centered]}>
        <ActivityIndicator color={colors.pink} />
        <Text variant="bodyMedium" tone="primary" style={styles.centerText}>
          {stalled ? "This is taking longer than expected." : "We're confirming your payment."}
        </Text>
        <Pressable onPress={checkNow} disabled={isChecking} accessibilityRole="button" style={styles.checkNowButton}>
          <Text variant="small" tone="pink">
            {isChecking ? "Checking…" : "Check now"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (terminalFailed) {
    return (
      <View style={styles.panel}>
        <Text variant="small" tone="error">
          {payment?.failureReasonSafe ?? "Payment could not be completed."}
        </Text>
        <Button
          label="Try again"
          onPress={() => {
            initiate.reset();
            reset();
          }}
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      {initiate.isError && (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(initiate.error)}
        </Text>
      )}
      <View style={styles.cardNotice}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
        <Text variant="small" tone="secondary" style={styles.cardNoticeText}>
          You&apos;ll be securely redirected to enter your card details. CrownSourceGlobal never sees or stores your card number.
        </Text>
      </View>
      <Button label={initiate.isPending ? "Redirecting…" : "Pay with Visa / Mastercard"} onPress={handlePay} disabled={initiate.isPending} loading={initiate.isPending} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: TouchTarget },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  totalCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, alignItems: "center" },
  totalValue: { marginTop: 2 },
  tabRow: { flexDirection: "row", borderWidth: 1, borderRadius: Radius.pill, padding: 3 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: Spacing.xs, borderRadius: Radius.pill },
  panel: { gap: Spacing.sm },
  centered: { alignItems: "center", paddingVertical: Spacing.lg },
  centerText: { textAlign: "center" },
  checkNowButton: { marginTop: Spacing.xs, padding: Spacing.xs },
  input: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: 15 },
  networkRow: { flexDirection: "row", gap: Spacing.sm },
  networkOption: { flex: 1, alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: Radius.md, paddingVertical: Spacing.sm },
  networkLabel: { fontWeight: "600" },
  cardNotice: { flexDirection: "row", gap: Spacing.xs, alignItems: "flex-start" },
  cardNoticeText: { flex: 1, lineHeight: 18 },
});
