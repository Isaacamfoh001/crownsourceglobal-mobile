import { Tabs } from "expo-router";
import { View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spacing, Radius } from "@/constants/theme";
import { VendorTabBar } from "@/components/navigation/VendorTabBar";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";

/**
 * Vendor Mode bottom navigation (M27 §23): Dashboard / Listings / Orders /
 * Finance / More. A distinct route group/component set from the customer
 * TabBar, so Vendor Mode reads as its own coherent operational workspace
 * — but detail screens (a listing, an order, a settlement…) are flat
 * top-level `vendor-*` routes in the root Stack, not nested inside this
 * group, so switching between customer/vendor screens stays a normal
 * push/pop instead of a second nested navigator stack.
 */
export default function VendorModeLayout() {
  const { ready } = useVendorModeGuard();

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

  return (
    <Tabs tabBar={(props) => <VendorTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="listings" options={{ title: "Listings" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="finance" options={{ title: "Finance" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
