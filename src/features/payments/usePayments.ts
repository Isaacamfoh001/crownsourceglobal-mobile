import { useMutation, useQuery, type Query } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { CardPaymentInitiateDTO, MobileMoneyNetworkCode, PaymentStatusDTO } from "@/types/api";

type RefetchInterval = number | false | ((query: Query<PaymentStatusDTO, Error, PaymentStatusDTO, readonly ["payment-status", string | undefined]>) => number | false | undefined);

/** Initiate a Mobile Money payment attempt (M25) — provider-neutral, routes to whichever real provider is active server-side (Paystack primary). */
export function useInitiateMobileMoneyPayment(orderId: string) {
  return useMutation({
    mutationFn: (input: { network: MobileMoneyNetworkCode; phone: string }) =>
      apiClient.post<PaymentStatusDTO>(`/api/v1/orders/${orderId}/payments/mobile-money`, { body: input }),
  });
}

/** Resubmits the OTP against the SAME payment attempt (never a new one). */
export function useSubmitMobileMoneyOtp(orderId: string) {
  return useMutation({
    mutationFn: (input: { paymentId: string; phone: string; otpcode: string }) =>
      apiClient.post<PaymentStatusDTO>(`/api/v1/orders/${orderId}/payments/mobile-money/otp`, { body: input }),
  });
}

/**
 * Card payment (M25) — always Paystack-hosted Checkout. Never collects card
 * details on-device: the returned `authorizationUrl` is opened in an
 * in-app browser (expo-web-browser), and the actual result always comes
 * from `usePaymentStatus`'s independent poll after the browser is
 * dismissed, never from anything the browser tab displayed.
 */
export function useInitiateCardPayment(orderId: string) {
  return useMutation({
    mutationFn: () => apiClient.post<CardPaymentInitiateDTO>(`/api/v1/orders/${orderId}/payments/card`, {}),
  });
}

/**
 * The bounded customer-facing status poll (M25) — `GET /api/v1/payments/:id`.
 * The mobile client never queries Paystack directly; this always goes
 * through CrownSourceGlobal's own server, which only re-verifies against
 * the provider when its last check is stale. `refetchInterval` is left to
 * the caller; it accepts TanStack Query's function form (deciding from
 * `query.state.data`) specifically so a caller can stop polling once a
 * terminal status arrives without ever copying query data into its own
 * state via a `useEffect` (see checkout/[orderId]/payment.tsx's
 * usePaymentPolling — https://react.dev/learn/you-might-not-need-an-effect).
 */
export function usePaymentStatus(paymentId: string | undefined, options: { refetchInterval?: RefetchInterval } = {}) {
  return useQuery({
    queryKey: ["payment-status", paymentId] as const,
    queryFn: () => apiClient.get<PaymentStatusDTO>(`/api/v1/payments/${paymentId}`),
    enabled: Boolean(paymentId),
    refetchInterval: options.refetchInterval ?? false,
  });
}
