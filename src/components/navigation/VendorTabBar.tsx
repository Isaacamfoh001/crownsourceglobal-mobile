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
};

const LABELS: Record<string, string> = {
  index: "Dashboard",
  listings: "Listings",
  orders: "Orders",
  finance: "Finance",
  more: "More",
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

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, Spacing.xs) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
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
