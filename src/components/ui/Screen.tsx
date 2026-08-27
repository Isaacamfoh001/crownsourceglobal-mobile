import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

type ScreenProps = {
  scroll?: boolean;
  children: ReactNode;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Edges to apply safe-area padding to; bottom is usually owned by the tab bar instead. */
  edges?: ("top" | "bottom" | "left" | "right")[];
};

/** Shared screen container: safe-area aware, theme-background, optional pull-to-refresh scroll. */
export function Screen({ scroll = true, children, contentStyle, onRefresh, refreshing = false, edges = ["top"] }: ScreenProps) {
  const { colors } = useAppTheme();

  if (!scroll) {
    return (
      <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={[styles.flex, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
