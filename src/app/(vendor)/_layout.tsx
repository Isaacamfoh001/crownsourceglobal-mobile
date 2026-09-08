import { Tabs } from "expo-router";
import { View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spacing, Radius } from "@/constants/theme";
import { VendorTabBar } from "@/components/navigation/VendorTabBar";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useExperience } from "@/hooks/useExperience";

/**
 * Vendor Mode bottom navigation (M27 §23, mode-aware since M32.3). A
 * distinct route group/component set from the customer TabBar, so Vendor
 * Mode reads as its own coherent operational workspace — but detail
 * screens (a listing, an order, a settlement…) are flat top-level
 * `vendor-*` routes in the root Stack, not nested inside this group, so
 * switching between customer/vendor screens stays a normal push/pop
 * instead of a second nested navigator stack.
 *
 * Which five tabs render depends on the current Experience Mode
 * (`useExperience`) — never a new navigator, never a new auth check: this
 * is presentation only, and every underlying `vendor-*` route/API call
 * stays exactly as authorization-scoped as before. A vendor with no
 * FACTORY/BEAUTY eligibility (or whose stored mode preference doesn't
 * match a real capability) always falls back to the default Seller tab
 * set — see useVendorModeGuard for the actual membership gate.
 */
export default function VendorModeLayout() {
  const { ready } = useVendorModeGuard();
  const { experience, availableExperiences } = useExperience();

  if (!ready) {
    return (
      <Screen>
        <View style={{ padding: Spacing.md, gap: Spacing.md }}>
          <Skeleton height={20} width={160} radius={Radius.sm} />
          <Skeleton height={120} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  const mode = (experience === "FACTORY" || experience === "BEAUTY") && availableExperiences.includes(experience) ? experience : "SELLER";

  return (
    <Tabs tabBar={(props) => <VendorTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="listings" options={{ title: "Products", href: mode === "SELLER" ? undefined : null }} />
      <Tabs.Screen name="sourcing" options={{ title: "Sourcing", href: mode === "FACTORY" ? undefined : null }} />
      <Tabs.Screen name="services" options={{ title: "Services", href: mode === "BEAUTY" ? undefined : null }} />
      <Tabs.Screen name="requests" options={{ title: "Requests", href: mode === "BEAUTY" ? undefined : null }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", href: mode === "BEAUTY" ? null : undefined }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", href: mode === "BEAUTY" ? undefined : null }} />
      <Tabs.Screen name="finance" options={{ title: "Earnings", href: mode === "BEAUTY" ? null : undefined }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
