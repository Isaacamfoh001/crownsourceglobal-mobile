import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Color, Radius, Spacing, TouchTarget } from "@/constants/theme";
import { Text } from "@/components/ui/Text";

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: "home", inactive: "home-outline" },
  explore: { active: "compass", inactive: "compass-outline" },
  shop: { active: "bag-handle", inactive: "bag-handle-outline" },
  source: { active: "earth", inactive: "earth-outline" },
  account: { active: "person-circle", inactive: "person-circle-outline" },
};

const LABELS: Record<string, string> = {
  index: "Home",
  explore: "Explore",
  shop: "Shop",
  source: "Source",
  account: "Account",
};

/**
 * Custom bottom tab bar — deliberately not expo-router's experimental
 * unstable-native-tabs (native tab bars can't reproduce the client
 * mockup's pink active-pill treatment), and kept as one persistent dark
 * bar across every tab rather than recoloring per screen, so Home's dark
 * canvas and Shop/Explore's light canvas still read as one product.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
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
            style={styles.tabHitArea}
          >
            <View style={[styles.pill, focused && styles.pillActive]}>
              <Ionicons name={focused ? icons.active : icons.inactive} size={22} color={focused ? Color.inverseText : Color.brand.textSecondary} />
              {focused && (
                <Text variant="caption" tone="inverse" style={styles.label}>
                  {label}
                </Text>
              )}
            </View>
            {!focused && (
              <Text variant="caption" tone="onDarkMuted" style={styles.inactiveLabel}>
                {label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: Color.brand.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Color.brand.border,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  tabHitArea: {
    flex: 1,
    minHeight: TouchTarget,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  pillActive: {
    backgroundColor: Color.pink,
  },
  label: { marginTop: 0 },
  inactiveLabel: { marginTop: 2 },
});
