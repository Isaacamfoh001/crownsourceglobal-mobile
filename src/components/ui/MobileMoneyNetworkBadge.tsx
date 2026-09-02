import { StyleSheet, View } from "react-native";
import { Radius } from "@/constants/theme";
import { Text } from "./Text";
import type { MobileMoneyNetworkCode } from "@/types/api";

/**
 * M25.2 — Ghana Mobile Money network identity for the payment method
 * selector. No official logo artwork is bundled: there was no verified,
 * licensable source available for MTN/Telecel/AT's trademarked logo files,
 * and hotlinking one from the web is unsafe and against policy. Each
 * network is instead given its well-known brand color plus its wordmark as
 * text — enough to make the three options instantly distinguishable at a
 * glance without reproducing trademarked artwork pixel-for-pixel. If exact
 * official brand assets/hex values become available later, swap them in
 * here — this is the only place network identity is defined.
 *
 * Restricted to exactly the three networks the backend Paystack
 * integration actually supports (modules/payments/provider.ts's
 * PaymentNetworkCode in the main repo) — never invents a fourth.
 */
const NETWORK_STYLE: Record<MobileMoneyNetworkCode, { bg: string; fg: string; mark: string; label: string }> = {
  MTN: { bg: "#FFCC00", fg: "#1A1A1A", mark: "MTN", label: "MTN MoMo" },
  TELECEL: { bg: "#E30613", fg: "#FFFFFF", mark: "T", label: "Telecel Cash" },
  AT: { bg: "#0F3D91", fg: "#FFFFFF", mark: "AT", label: "AT Money" },
};

export function networkDisplayName(network: MobileMoneyNetworkCode): string {
  return NETWORK_STYLE[network].label;
}

export function MobileMoneyNetworkBadge({ network, size = 28 }: { network: MobileMoneyNetworkCode; size?: number }) {
  const { bg, fg, mark } = NETWORK_STYLE[network];
  return (
    <View style={[styles.badge, { backgroundColor: bg, width: size, height: size, borderRadius: Radius.sm }]}>
      <Text style={[styles.mark, { color: fg, fontSize: size * 0.4 }]} numberOfLines={1}>
        {mark}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
  mark: { fontWeight: "800", letterSpacing: -0.3 },
});
