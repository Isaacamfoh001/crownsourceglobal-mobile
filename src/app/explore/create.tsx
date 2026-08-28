import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { isEligibleExploreProvider } from "@/features/explore/eligibility";
import { useExploreCategories } from "@/features/explore/useExploreCategories";
import { useCreateExplorePost, type ExplorePostImageInput } from "@/features/explore/useCreateExplorePost";
import { friendlyErrorMessage } from "@/lib/api/errors";

const MAX_IMAGES = 6;
const MIN_CAPTION_LENGTH = 3;
const MAX_CAPTION_LENGTH = 500;

/**
 * Explore post creation (M21 §17) — mobile's minimal real provider posting
 * flow: select images → caption → category → preview → submit. One shot,
 * no persisted "save as draft" step (see modules/explore-posts/service.ts's
 * createAndSubmit doc comment) — submitting sends the post straight to
 * Admin moderation.
 */
export default function CreateExplorePostScreen() {
  const { colors } = useAppTheme();
  const { status, me } = useAuth();
  const canPost = status === "SIGNED_IN" && isEligibleExploreProvider(me);

  const categoriesQuery = useExploreCategories(canPost);
  const createMutation = useCreateExplorePost();

  const [images, setImages] = useState<ExplorePostImageInput[]>([]);
  const [caption, setCaption] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  if (!canPost) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Vendors only"
          message="Only approved CrownSourceGlobal vendors can post to Explore."
        />
      </SafeAreaView>
    );
  }

  const pickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo library access in Settings to add images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;

    const picked: ExplorePostImageInput[] = result.assets.map((asset) => ({
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    }));
    setImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const trimmedCaption = caption.trim();
  const canSubmit =
    images.length >= 1 && trimmedCaption.length >= MIN_CAPTION_LENGTH && trimmedCaption.length <= MAX_CAPTION_LENGTH && Boolean(categoryId);

  const onSubmit = () => {
    if (!canSubmit || !categoryId || createMutation.isPending) return;
    createMutation.mutate(
      { caption: trimmedCaption, categoryId, images },
      {
        onSuccess: () => {
          Alert.alert("Submitted for review", "Your post will appear on Explore once CrownSourceGlobal approves it.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            Share your work
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="smallMedium" tone="secondary">
            Photos
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {images.map((image, index) => (
              <View key={image.uri} style={styles.imageThumbWrap}>
                <Image source={{ uri: image.uri }} style={styles.imageThumb} contentFit="cover" />
                <Pressable
                  onPress={() => removeImage(index)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES ? (
              <Pressable
                onPress={pickImages}
                accessibilityRole="button"
                accessibilityLabel="Add photos"
                style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
              >
                <Ionicons name="add" size={26} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </ScrollView>
          <Text variant="small" tone="muted">
            {images.length}/{MAX_IMAGES} photos · at least 1 required
          </Text>

          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            Caption
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Describe the finished work — style, technique, anything you'd want customers to know"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={MAX_CAPTION_LENGTH}
            style={[styles.captionInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
          />
          <Text variant="small" tone="muted">
            {caption.length}/{MAX_CAPTION_LENGTH}
          </Text>

          <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
            Category
          </Text>
          {categoriesQuery.isPending ? (
            <Text variant="small" tone="muted">
              Loading categories…
            </Text>
          ) : (
            <View style={styles.categoryRow}>
              {(categoriesQuery.data?.categories ?? []).map((category) => (
                <CategoryTile
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </View>
          )}

          {createMutation.isError ? (
            <Text variant="small" tone="error" style={styles.errorText}>
              {friendlyErrorMessage(createMutation.error)}
            </Text>
          ) : null}

          <Button
            label={createMutation.isPending ? "Submitting…" : "Submit for review"}
            onPress={onSubmit}
            disabled={!canSubmit || createMutation.isPending}
            loading={createMutation.isPending}
            fullWidth
            style={styles.submitButton}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const THUMB_SIZE = 84;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerSpacer: { width: 24 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.xxs },
  sectionLabel: { marginTop: Spacing.md },
  imageRow: { gap: Spacing.xs, paddingVertical: Spacing.xs },
  imageThumbWrap: { position: "relative" },
  imageThumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Radius.md },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(20,16,24,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButton: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  captionInput: {
    minHeight: 90,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    fontSize: 14,
    textAlignVertical: "top",
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  errorText: { marginTop: Spacing.sm },
  submitButton: { marginTop: Spacing.lg },
});
