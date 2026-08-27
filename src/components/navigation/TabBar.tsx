import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
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
 * mockup's icon+label treatment with a pink active state), theme-aware
 * (dark charcoal bar in dark mode, warm-pearl bar in light mode). Every tab
 * always shows icon + label (fixed-width columns, no pill that grows/
 * shrinks with the active label) so nothing can overflow at 320px.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.pinkSurface }]}>
              <Ionicons name={focused ? icons.active : icons.inactive} size={20} color={focused ? colors.pink : colors.textMuted} />
            </View>
            <Text variant="caption" tone={focused ? "pink" : "muted"} numberOfLines={1} style={styles.label}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.xs,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    minHeight: TouchTarget,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconWrap: {
    width: 30,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  label: { includeFontPadding: false },
});
