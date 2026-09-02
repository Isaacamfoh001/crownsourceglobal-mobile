import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategories } from "@/features/categories/useCategories";
import { prepareImage } from "@/lib/media/prepareImage";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import {
  useVendorListingDetail,
  useSaveVendorListingContent,
  useSubmitVendorListing,
  useUpdateVendorListingInventory,
  useToggleVendorListingActive,
  type VendorListingImageInput,
} from "@/features/vendor/useVendorListings";
import type { VendorListingImageDTO } from "@/types/api";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";

const MAX_IMAGES = 5;
const AVAILABILITY_OPTIONS = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "MADE_TO_ORDER", label: "Made to order" },
] as const;

const THUMB_SIZE = 84;

export default function VendorListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorListingDetail(ready ? id : undefined);

  if (!ready) return null;

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={20} width={160} radius={Radius.sm} />
          <Skeleton height={200} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState title="Couldn't load this listing" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const listing = query.data;
  const locked = listing.approvalStatus === "PENDING" && listing.submittedAt !== null;
  const approval = vendorStatus.listingApproval(listing.approvalStatus);
  const lifecycle = vendorStatus.listing(listing.listingStatus);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary" numberOfLines={1} style={styles.flex}>
            {listing.title || "New listing"}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <StatusBadge label={approval.label} tone={approval.tone} />
          <StatusBadge label={lifecycle.label} tone={lifecycle.tone} />
        </View>

        {listing.changesRequestedReason ? (
          <View style={[styles.notice, { backgroundColor: colors.warningSurface, borderColor: colors.warning }]}>
            <Text variant="small" tone="warning">
              Changes requested: {listing.changesRequestedReason}
            </Text>
          </View>
        ) : null}

        {listing.pendingChanges ? (
          <View style={[styles.notice, { backgroundColor: colors.goldSurface, borderColor: colors.gold }]}>
            <Text variant="small" tone="gold">
              This listing is LIVE with your latest APPROVED details. You have an edit pending review — the live version stays visible to
              customers until CrownSourceGlobal approves the change.
            </Text>
          </View>
        ) : null}

        {locked ? (
          <View style={[styles.notice, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <Text variant="small" tone="secondary">
              This listing is awaiting review and can&apos;t be edited right now.
            </Text>
          </View>
        ) : null}

        {!locked ? <ListingForm listing={listing} /> : null}

        <InventorySection listingId={listing.id} availableQuantity={listing.availableQuantity} availabilityStatus={listing.availabilityStatus} />

        {listing.approvalStatus === "APPROVED" ? (
          <ActiveToggleSection listingId={listing.id} listingStatus={listing.listingStatus} />
        ) : null}

        <View style={styles.bottomSpacer} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function ListingForm({ listing }: { listing: NonNullable<ReturnType<typeof useVendorListingDetail>["data"]> }) {
  const { colors } = useAppTheme();
  const categoriesQuery = useCategories();
  const saveContent = useSaveVendorListingContent();
  const submitListing = useSubmitVendorListing();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [categoryId, setCategoryId] = useState(listing.categoryId);
  const [basePrice, setBasePrice] = useState(String(Number(listing.price.amount)));
  const [moq, setMoq] = useState(String(listing.moq));
  const [maxOq, setMaxOq] = useState(listing.maxOq !== null ? String(listing.maxOq) : "");
  const [leadTimeDays, setLeadTimeDays] = useState(listing.leadTimeDays !== null ? String(listing.leadTimeDays) : "");
  const [existingImages, setExistingImages] = useState<VendorListingImageDTO[]>(listing.images);
  const [newImages, setNewImages] = useState<VendorListingImageInput[]>([]);

  // Re-sync the kept-image list whenever the server hands back a new
  // `listing.images` (e.g. right after a save) — adjusted during render,
  // not an effect, same pattern as FallbackImage.tsx's own doc comment.
  const [syncedImages, setSyncedImages] = useState(listing.images);
  if (listing.images !== syncedImages) {
    setSyncedImages(listing.images);
    setExistingImages(listing.images);
  }

  const totalImages = existingImages.length + newImages.length;

  const pickImages = async () => {
    const remaining = MAX_IMAGES - totalImages;
    if (remaining <= 0) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo library access in Settings to add images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.8 });
    if (result.canceled) return;
    const prepared = await Promise.all(result.assets.map((asset) => prepareImage(asset, "listing")));
    setNewImages((current) => [...current, ...prepared].slice(0, remaining + current.length));
  };

  const removeExistingImage = (key: string) => setExistingImages((current) => current.filter((img) => img.key !== key));
  const removeNewImage = (index: number) => setNewImages((current) => current.filter((_, i) => i !== index));

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const priceValue = Number(basePrice);
  const moqValue = Number(moq) || 1;
  const canSave = trimmedTitle.length >= 3 && trimmedDescription.length >= 10 && Boolean(categoryId) && priceValue > 0 && totalImages >= 1;

  const onSave = () => {
    if (!canSave || saveContent.isPending) return;
    saveContent.mutate({
      listingId: listing.id,
      title: trimmedTitle,
      description: trimmedDescription,
      categoryId,
      basePrice: priceValue,
      moq: moqValue,
      maxOq: maxOq ? Number(maxOq) : null,
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
      specs: listing.specs,
      existingImages: existingImages.map((img) => img.key),
      newImages,
      bulkTiers: listing.bulkPriceTiers.map((tier) => ({ minQuantity: tier.minQuantity, maxQuantity: tier.maxQuantity, unitPrice: Number(tier.unitPrice.amount) })),
    });
  };

  const onSubmit = () => {
    if (submitListing.isPending) return;
    submitListing.mutate(listing.id, {
      onSuccess: () => Alert.alert("Submitted for review", "CrownSourceGlobal will review your listing."),
    });
  };

  return (
    <View style={styles.formSection}>
      <Text variant="smallMedium" tone="secondary">
        Photos
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
        {existingImages.map((img) => (
          <View key={img.key} style={styles.imageThumbWrap}>
            <Image source={{ uri: img.url }} style={styles.imageThumb} contentFit="cover" />
            <Pressable onPress={() => removeExistingImage(img.key)} accessibilityRole="button" accessibilityLabel="Remove photo" style={[styles.removeButton, { backgroundColor: colors.textPrimary }]}>
              <Ionicons name="close" size={14} color={colors.bg} />
            </Pressable>
          </View>
        ))}
        {newImages.map((img, index) => (
          <View key={img.uri} style={styles.imageThumbWrap}>
            <Image source={{ uri: img.uri }} style={styles.imageThumb} contentFit="cover" />
            <Pressable onPress={() => removeNewImage(index)} accessibilityRole="button" accessibilityLabel="Remove photo" style={[styles.removeButton, { backgroundColor: colors.textPrimary }]}>
              <Ionicons name="close" size={14} color={colors.bg} />
            </Pressable>
          </View>
        ))}
        {totalImages < MAX_IMAGES ? (
          <Pressable onPress={pickImages} accessibilityRole="button" accessibilityLabel="Add photos" style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="add" size={26} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </ScrollView>
      <Text variant="small" tone="muted">
        {totalImages}/{MAX_IMAGES} photos · at least 1 required · real photos only
      </Text>

      <TextField label="Title" value={title} onChangeText={setTitle} />

      <View style={styles.fieldWrap}>
        <Text variant="smallMedium" tone="secondary">
          Description
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Describe this product"
          placeholderTextColor={colors.textMuted}
          style={[styles.multiline, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
        />
      </View>

      <Text variant="smallMedium" tone="secondary">
        Category
      </Text>
      <View style={styles.categoryRow}>
        {(categoriesQuery.data?.categories ?? []).map((category) => (
          <CategoryTile key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label="Price (GHS)" value={basePrice} onChangeText={setBasePrice} keyboardType="decimal-pad" />
        </View>
        <View style={styles.flex}>
          <TextField label="Min. order qty" value={moq} onChangeText={setMoq} keyboardType="number-pad" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label="Max. order qty (optional)" value={maxOq} onChangeText={setMaxOq} keyboardType="number-pad" />
        </View>
        <View style={styles.flex}>
          <TextField label="Lead time (days, optional)" value={leadTimeDays} onChangeText={setLeadTimeDays} keyboardType="number-pad" />
        </View>
      </View>

      {saveContent.isError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(saveContent.error)}
        </Text>
      ) : null}

      <Button label={saveContent.isPending ? "Saving…" : "Save"} onPress={onSave} disabled={!canSave || saveContent.isPending} loading={saveContent.isPending} fullWidth />

      {submitListing.isError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(submitListing.error)}
        </Text>
      ) : null}
      <Button label={submitListing.isPending ? "Submitting…" : "Submit for review"} variant="outline" onPress={onSubmit} disabled={submitListing.isPending} loading={submitListing.isPending} fullWidth />
    </View>
  );
}

function InventorySection({ listingId, availableQuantity, availabilityStatus }: { listingId: string; availableQuantity: number; availabilityStatus: string }) {
  const updateInventory = useUpdateVendorListingInventory();
  const [quantity, setQuantity] = useState(String(availableQuantity));
  const [status, setStatus] = useState(availabilityStatus);

  // Re-sync after a save confirms new server values — see the render-time
  // sync note on ListingForm's `syncedImages` above.
  const [synced, setSynced] = useState({ availableQuantity, availabilityStatus });
  if (synced.availableQuantity !== availableQuantity || synced.availabilityStatus !== availabilityStatus) {
    setSynced({ availableQuantity, availabilityStatus });
    setQuantity(String(availableQuantity));
    setStatus(availabilityStatus);
  }

  const onSave = () => {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0 || updateInventory.isPending) return;
    updateInventory.mutate({ listingId, availableQuantity: qty, availabilityStatus: status });
  };

  return (
    <View style={styles.formSection}>
      <Text variant="sectionHeading" tone="primary">
        Inventory
      </Text>
      <TextField label="Available quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
      <Text variant="smallMedium" tone="secondary">
        Availability
      </Text>
      <View style={styles.categoryRow}>
        {AVAILABILITY_OPTIONS.map((option) => (
          <CategoryTile key={option.value} label={option.label} selected={status === option.value} onPress={() => setStatus(option.value)} />
        ))}
      </View>
      {updateInventory.isError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(updateInventory.error)}
        </Text>
      ) : null}
      {updateInventory.isSuccess ? (
        <Text variant="small" tone="success">
          Inventory updated
        </Text>
      ) : null}
      <Button label={updateInventory.isPending ? "Saving…" : "Update inventory"} variant="outline" onPress={onSave} disabled={updateInventory.isPending} loading={updateInventory.isPending} fullWidth />
    </View>
  );
}

function ActiveToggleSection({ listingId, listingStatus }: { listingId: string; listingStatus: string }) {
  const toggleActive = useToggleVendorListingActive();
  const isActive = listingStatus === "ACTIVE";

  return (
    <View style={styles.formSection}>
      <Text variant="sectionHeading" tone="primary">
        Visibility
      </Text>
      <Text variant="small" tone="secondary">
        {isActive ? "This listing is visible to customers in Shop." : "This listing is hidden from Shop."}
      </Text>
      {toggleActive.isError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(toggleActive.error)}
        </Text>
      ) : null}
      <Button
        label={isActive ? "Hide from Shop" : "Show in Shop"}
        variant="outline"
        onPress={() => toggleActive.mutate({ listingId, active: !isActive })}
        disabled={toggleActive.isPending}
        loading={toggleActive.isPending}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  badgeRow: { flexDirection: "row", gap: Spacing.xs, paddingHorizontal: Spacing.md },
  notice: { marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm },
  formSection: { padding: Spacing.md, gap: Spacing.sm },
  fieldWrap: { gap: Spacing.xxs },
  multiline: { minHeight: 90, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, fontSize: 14, textAlignVertical: "top" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  row: { flexDirection: "row", gap: Spacing.sm },
  imageRow: { gap: Spacing.xs, paddingVertical: Spacing.xs },
  imageThumbWrap: { position: "relative" },
  imageThumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Radius.md },
  removeButton: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  addImageButton: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Radius.md, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  bottomSpacer: { height: Spacing.xxl },
});
