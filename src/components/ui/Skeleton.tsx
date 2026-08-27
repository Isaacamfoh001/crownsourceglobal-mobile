import { useEffect, useState } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { Radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

type SkeletonProps = {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
};

/** Simple pulsing placeholder — no extra dependency. Used for every API-backed screen's initial loading state. */
export function Skeleton({ width = "100%", height, radius = Radius.sm, style }: SkeletonProps) {
  const { colors } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceSubtle, opacity }, style]} />;
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.gridItem}>
          <Skeleton height={140} radius={Radius.md} />
          <Skeleton height={14} style={styles.gap} />
          <Skeleton height={14} width="60%" style={styles.gap} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  gridItem: { width: "47%" },
  gap: { marginTop: 8 },
});
