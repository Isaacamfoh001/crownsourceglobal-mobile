import { useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Color } from "@/constants/theme";
import { Text } from "./Text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ImageGalleryProps = {
  images: string[];
  height?: number;
};

/** Native swipe-paged gallery for Product Detail — no carousel dependency, just a paged FlatList + dot indicator. */
export function ImageGallery({ images, height = SCREEN_WIDTH }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text variant="body" tone="onLightFaint">
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
        <View style={styles.dots}>
          {images.map((_, index) => (
            <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: Color.commerce.surfaceSubtle, alignItems: "center", justifyContent: "center" },
  dots: { position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: Color.inverseText, width: 18 },
});
