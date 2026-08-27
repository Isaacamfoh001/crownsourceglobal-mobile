import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Color } from "@/constants/theme";

export type ScreenSurface = "brand" | "commerce";

type ScreenProps = {
  surface?: ScreenSurface;
  scroll?: boolean;
  children: ReactNode;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Edges to apply safe-area padding to; bottom is usually owned by the tab bar instead. */
  edges?: ("top" | "bottom" | "left" | "right")[];
};

/** Shared screen container: safe-area aware, brand (dark) vs commerce (light) canvas, optional pull-to-refresh scroll. */
export function Screen({
  surface = "commerce",
  scroll = true,
  children,
  contentStyle,
  onRefresh,
  refreshing = false,
  edges = ["top"],
}: ScreenProps) {
  const backgroundColor = surface === "brand" ? Color.brand.bg : Color.commerce.bg;

  if (!scroll) {
    return (
      <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor }]}>
        <View style={[styles.flex, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={surface === "brand" ? Color.goldOnDark : Color.pink}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
