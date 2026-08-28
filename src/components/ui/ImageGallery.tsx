import { useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ImageGalleryProps = {
  images: string[];
  /** width / height — defaults to a tall 4:5 hero, closer to premium fashion/beauty product photography than a plain square. */
  aspectRatio?: number;
};

/** Native swipe-paged gallery for Product Detail — no carousel dependency, just a paged FlatList + a compact "n/N" counter (M22.3 §11) instead of a dot row, which reads better against varied product photography and doesn't compete with the overlay back/share buttons. */
export function ImageGallery({ images, aspectRatio = 4 / 5 }: ImageGalleryProps) {
  const { colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const height = SCREEN_WIDTH / aspectRatio;

  if (images.length === 0) {
    return (
      <View style={[styles.fallback, { height, backgroundColor: colors.surfaceSubtle }]}>
        <Text variant="body" tone="muted">
          No image available
        </Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height }} contentFit="cover" transition={150} />
        )}
      />
      {images.length > 1 && (
        <View style={styles.counter}>
          <Text variant="caption" tone="inverse">
            {activeIndex + 1}/{images.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  counter: {
    position: "absolute",
    right: Spacing.sm,
    bottom: Spacing.sm,
    backgroundColor: "rgba(20,16,24,0.6)",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
