import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "@/components/ui/Text";

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: "grid", inactive: "grid-outline" },
  listings: { active: "pricetags", inactive: "pricetags-outline" },
  orders: { active: "cube", inactive: "cube-outline" },
  finance: { active: "wallet", inactive: "wallet-outline" },
  more: { active: "ellipsis-horizontal-circle", inactive: "ellipsis-horizontal-circle-outline" },
  // M32.3 — Factory/Beauty experience tabs.
  sourcing: { active: "globe", inactive: "globe-outline" },
  services: { active: "sparkles", inactive: "sparkles-outline" },
  requests: { active: "calendar", inactive: "calendar-outline" },
  explore: { active: "images", inactive: "images-outline" },
};

const LABELS: Record<string, string> = {
  index: "Dashboard",
  listings: "Products",
  orders: "Orders",
  finance: "Earnings",
  more: "More",
  sourcing: "Sourcing",
  services: "Services",
  requests: "Requests",
  explore: "Explore",
};

/**
 * Vendor Mode's own bottom navigation (M27 §23) — visually the same
 * language as the customer TabBar (same theming, same fixed-column
 * layout) but a distinct component/route set, so Vendor Mode reads as its
 * own coherent operational workspace rather than customer tabs with items
 * swapped in place.
 */
export function VendorTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  // `href: null` on a Tabs.Screen only hides its default tab-bar button
  // (via `tabBarItemStyle: { display: 'none' }` — see expo-router's
  // TabsClient) rather than removing the route from `state.routes`, so a
  // custom `tabBar` must re-check that style itself or every registered
  // screen renders regardless of the current Experience Mode (M32.4 §1/§2).
  const visibleRoutes = state.routes.filter((route) => {
    const style = descriptors[route.key].options.tabBarItemStyle as { display?: string } | undefined;
    return style?.display !== "none";
  });

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, Spacing.xs) }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const index = state.routes.indexOf(route);
        const focused = state.index === index;
        const icons = ICONS[route.name] ?? ICONS.index;
        const label = (options.title as string) ?? LABELS[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.goldSurface }]}>
              <Ionicons name={focused ? icons.active : icons.inactive} size={20} color={focused ? colors.goldStrong : colors.textMuted} />
            </View>
            <Text variant="caption" tone={focused ? "gold" : "muted"} numberOfLines={1} style={styles.label}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.xs, paddingHorizontal: 4 },
  tab: { flex: 1, minHeight: TouchTarget, alignItems: "center", justifyContent: "center", gap: 2 },
  iconWrap: { width: 30, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  label: { includeFontPadding: false },
});
