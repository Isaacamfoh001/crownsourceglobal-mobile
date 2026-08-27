import { Tabs } from "expo-router";
import { TabBar } from "@/components/navigation/TabBar";

/**
 * Customer bottom navigation (MOBILE_V1_PLAN.md §6.1): Home / Explore /
 * Shop / Source / Account. Vendor "Business mode" navigation is out of
 * scope for M19.0 — see docs/mobile/MOBILE_V1_PLAN.md §7.
 */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="shop" options={{ title: "Shop" }} />
      <Tabs.Screen name="source" options={{ title: "Source" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
