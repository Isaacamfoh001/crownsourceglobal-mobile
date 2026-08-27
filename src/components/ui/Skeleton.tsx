import { useEffect, useState } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { Color, Radius } from "@/constants/theme";

type SkeletonProps = {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
  tone?: "onDark" | "onLight";
};

/** Simple pulsing placeholder — no extra dependency. Used for every API-backed screen's initial loading state. */
export function Skeleton({ width = "100%", height, radius = Radius.sm, style, tone = "onLight" }: SkeletonProps) {
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

  const bg = tone === "onDark" ? "rgba(255,255,255,0.08)" : Color.commerce.surfaceSubtle;

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: bg, opacity }, style]} />;
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
