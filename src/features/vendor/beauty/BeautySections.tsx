import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/StateViews";
import { IconSize, Radius, Spacing, TouchTarget } from "@/constants/theme";
import { OTHER_CATEGORY_SLUG, OTHER_CATEGORY_LABEL } from "@/constants/categories";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useExploreCategories } from "@/features/explore/useExploreCategories";
import { prepareImage } from "@/lib/media/prepareImage";
import { vendorStatus } from "@/lib/vendorStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import {
  useVendorBeautyProfile,
  useSaveVendorBeautyProfile,
  useVendorServices,
  useCreateVendorService,
  useUpdateVendorService,
  useToggleVendorServiceActive,
  useVendorServiceRequests,
  useAcceptServiceRequest,
  useDeclineServiceRequest,
} from "@/features/vendor/useVendorBeautyProfessional";
import type { VendorServiceDTO } from "@/types/api";

/**
 * M32.3 — `ProfileForm` originally lived inline in
 * `src/app/vendor-beauty-professional/index.tsx` ("Profile settings",
 * reachable from BEAUTY mode's "More" hub); it's extracted here so that
 * screen and the Beauty onboarding flow can share it. `ServicesSection`/
 * `RequestsSection` power the dedicated BEAUTY-mode `(vendor)` tabs
 * (`services.tsx`, `requests.tsx`) only, as of M32.4.1 §2 — "Profile
 * settings" no longer duplicates them.
 */
export const LOCATION_MODES = [
  { value: "PROVIDER_LOCATION", label: "My location" },
  { value: "CUSTOMER_LOCATION", label: "Customer's location" },
  { value: "BOTH", label: "Both" },
] as const;

export function ProfileForm({ profile }: { profile: ReturnType<typeof useVendorBeautyProfile>["data"] }) {
  const { colors } = useAppTheme();
  const categoriesQuery = useExploreCategories();
  const save = useSaveVendorBeautyProfile();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [specialtyCategorySlugs, setSpecialtyCategorySlugs] = useState<string[]>(profile?.specialtyCategorySlugs ?? []);
  const [locationMode, setLocationMode] = useState<(typeof LOCATION_MODES)[number]["value"]>(profile?.locationMode ?? "PROVIDER_LOCATION");
  const [heroImage, setHeroImage] = useState<{ uri: string; mimeType: string; fileName: string } | undefined>(undefined);

  const pickHeroImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo library access in Settings to add a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    const prepared = await prepareImage(result.assets[0], "beauty-hero");
    setHeroImage(prepared);
  };

  const canSave = displayName.trim().length >= 2 && specialtyCategorySlugs.length > 0;

  const onSave = () => {
    if (!canSave || save.isPending) return;
    save.mutate(
      { displayName, bio: bio || undefined, specialtyCategorySlugs, locationMode, heroImage },
      { onSuccess: () => setHeroImage(undefined) },
    );
  };

  return (
    <View style={styles.section}>
      {profile ? (
        <View style={styles.badgeRow}>
          <StatusBadge label={vendorStatus.beautyProfile(profile.status).label} tone={vendorStatus.beautyProfile(profile.status).tone} />
        </View>
      ) : (
        <Text variant="small" tone="secondary">
          Set up your Beauty Professional profile to appear on Explore and receive service requests.
        </Text>
      )}
      {profile?.changesRequestedReason ? (
        <Text variant="small" tone="warning">
          Changes requested: {profile.changesRequestedReason}
        </Text>
      ) : null}

      <Pressable onPress={pickHeroImage} style={styles.heroPicker}>
        {heroImage ? (
          <Image source={{ uri: heroImage.uri }} style={styles.heroImage} contentFit="cover" />
        ) : profile?.heroImage ? (
          <Image source={{ uri: profile.heroImage }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroPlaceholder, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
            <Text variant="small" tone="secondary">
              Add a photo
            </Text>
          </View>
        )}
      </Pressable>

      <TextField label="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      <TextField label="Bio (optional)" value={bio} onChangeText={setBio} />

      <Text variant="smallMedium" tone="secondary">
        Specialties
      </Text>
      <View style={styles.categoryRow}>
        {(categoriesQuery.data?.categories ?? []).map((category) => (
          <CategoryTile
            key={category.id}
            label={category.name}
            selected={specialtyCategorySlugs.includes(category.slug)}
            onPress={() =>
              setSpecialtyCategorySlugs((current) => (current.includes(category.slug) ? current.filter((s) => s !== category.slug) : [...current, category.slug]))
            }
          />
        ))}
      </View>

      <Text variant="smallMedium" tone="secondary">
        Where you work
      </Text>
      <View style={styles.categoryRow}>
        {LOCATION_MODES.map((mode) => (
          <CategoryTile key={mode.value} label={mode.label} selected={locationMode === mode.value} onPress={() => setLocationMode(mode.value)} />
        ))}
      </View>

      {save.isError ? (
        <Text variant="small" tone="error">
          {friendlyErrorMessage(save.error)}
        </Text>
      ) : null}
      <Button label={save.isPending ? "Saving…" : profile ? "Save changes" : "Create profile"} onPress={onSave} disabled={!canSave || save.isPending} loading={save.isPending} fullWidth />
    </View>
  );
}

type ServiceFormState = { mode: "create" } | { mode: "edit"; service: VendorServiceDTO };

export function ServicesSection() {
  const { colors } = useAppTheme();
  const servicesQuery = useVendorServices(true);
  const toggleActive = useToggleVendorServiceActive();
  const services = servicesQuery.data ?? [];

  const [formState, setFormState] = useState<ServiceFormState | null>(null);

  return (
    <View style={styles.section}>
      {servicesQuery.isPending ? (
        <Skeleton height={90} radius={Radius.lg} />
      ) : services.length === 0 ? (
        <EmptyState
          icon="cut-outline"
          title="Add your services"
          message="Tell customers what you offer and how much it starts from."
          actionLabel="Add service"
          onAction={() => setFormState({ mode: "create" })}
        />
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text variant="sectionHeading" tone="primary">
                Services
              </Text>
              <Text variant="small" tone="secondary">
                {services.length} {services.length === 1 ? "service" : "services"}
              </Text>
            </View>
            <Button
              label="Add service"
              onPress={() => setFormState({ mode: "create" })}
              icon={<Ionicons name="add" size={18} color={colors.textOnAccent} />}
            />
          </View>

          {services.map((service) => {
            const isOther = service.category.slug === OTHER_CATEGORY_SLUG;
            return (
              <View key={service.id} style={[styles.serviceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.serviceCardHeader}>
                  <View style={styles.flex}>
                    <Text variant="cardTitle" tone="primary">
                      {service.name}
                    </Text>
                    <Text variant="small" tone="secondary">
                      {isOther ? service.categoryOther : service.category.name}
                    </Text>
                  </View>
                  <StatusBadge label={service.active ? "Active" : "Hidden"} tone={service.active ? "success" : "muted"} />
                </View>

                <Text variant="price" tone={service.startingPrice ? "primary" : "muted"} style={styles.priceText}>
                  {service.startingPrice ? `From ${formatMoney(service.startingPrice)}` : "Starting price not set"}
                </Text>

                {service.description ? (
                  <Text variant="small" tone="secondary" numberOfLines={2}>
                    {service.description}
                  </Text>
                ) : null}

                <View style={[styles.serviceCardActions, { borderTopColor: colors.border }]}>
                  <Pressable onPress={() => setFormState({ mode: "edit", service })} style={styles.actionButton} hitSlop={8}>
                    <Ionicons name="create-outline" size={IconSize.sm} color={colors.textSecondary} />
                    <Text variant="smallMedium" tone="secondary">
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleActive.mutate({ serviceId: service.id, active: !service.active })}
                    style={styles.actionButton}
                    hitSlop={8}
                  >
                    <Ionicons name={service.active ? "eye-off-outline" : "eye-outline"} size={IconSize.sm} color={colors.textSecondary} />
                    <Text variant="smallMedium" tone="secondary">
                      {service.active ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </>
      )}

      <ServiceFormModal state={formState} onClose={() => setFormState(null)} />
    </View>
  );
}

/**
 * The `Modal` itself stays mounted across opens/closes so its native
 * slide-in/out animation plays normally; `lastState` keeps rendering the
 * most recent non-null state while the sheet slides closed (visible only
 * follows `state !== null`), and `ServiceFormBody` is remounted by `key`
 * whenever a genuinely different target (a different service, or
 * create-vs-edit) opens, so its form fields always re-seed from fresh
 * `useState` initializers instead of a manual reset effect.
 */
function ServiceFormModal({ state, onClose }: { state: ServiceFormState | null; onClose: () => void }) {
  const { colors } = useAppTheme();
  const [lastState, setLastState] = useState(state);
  if (state !== null && state !== lastState) setLastState(state);

  return (
    <Modal visible={state !== null} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView edges={["top", "bottom"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.modalHeader}>
          <Text variant="sectionHeading" tone="primary">
            {lastState?.mode === "edit" ? "Edit service" : "Add service"}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        {lastState ? <ServiceFormBody key={stateKey(lastState)} state={lastState} onClose={onClose} /> : null}
      </SafeAreaView>
    </Modal>
  );
}

function ServiceFormBody({ state, onClose }: { state: ServiceFormState; onClose: () => void }) {
  const { colors } = useAppTheme();
  const categoriesQuery = useExploreCategories();
  const createService = useCreateVendorService();
  const updateService = useUpdateVendorService();

  const editingService = state.mode === "edit" ? state.service : null;
  const isEditingOther = editingService?.category.slug === OTHER_CATEGORY_SLUG;

  const [name, setName] = useState(editingService?.name ?? "");
  const [description, setDescription] = useState(editingService?.description ?? "");
  const [startingPrice, setStartingPrice] = useState(editingService?.startingPrice?.amount ?? "");
  const [categoryId, setCategoryId] = useState<string | undefined>(isEditingOther ? undefined : editingService?.category.id);
  const [showOtherInput, setShowOtherInput] = useState(Boolean(isEditingOther));
  const [categoryOther, setCategoryOther] = useState(editingService?.categoryOther ?? "");

  const mutation = state.mode === "edit" ? updateService : createService;
  const canSave = name.trim().length >= 2 && (showOtherInput ? categoryOther.trim().length > 0 : Boolean(categoryId));

  const onSave = () => {
    if (!canSave || mutation.isPending) return;
    const input = {
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: showOtherInput ? undefined : categoryId,
      categoryOther: showOtherInput ? categoryOther.trim() : undefined,
      startingPrice: startingPrice.trim() || undefined,
    };
    if (state.mode === "edit") {
      updateService.mutate({ serviceId: state.service.id, ...input }, { onSuccess: onClose });
    } else {
      createService.mutate(input, { onSuccess: onClose });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
        <TextField label="Service name" value={name} onChangeText={setName} placeholder="e.g. Bridal makeup" />

        <View style={styles.gapSm}>
          <Text variant="smallMedium" tone="secondary">
            Category
          </Text>
          <View style={styles.categoryRow}>
            {(categoriesQuery.data?.categories ?? []).map((category) => (
              <CategoryTile
                key={category.id}
                label={category.name}
                selected={!showOtherInput && categoryId === category.id}
                onPress={() => {
                  setCategoryId(category.id);
                  setShowOtherInput(false);
                }}
              />
            ))}
            <CategoryTile
              label={OTHER_CATEGORY_LABEL}
              selected={showOtherInput}
              onPress={() => {
                setShowOtherInput(true);
                setCategoryId(undefined);
              }}
            />
          </View>
          {showOtherInput ? (
            <TextField
              label="Enter category"
              value={categoryOther}
              onChangeText={setCategoryOther}
              placeholder="e.g. Bridal gele, Lash extensions, Henna"
              autoCapitalize="words"
            />
          ) : null}
        </View>

        <View>
          <TextField label="Starting price (GHS)" value={startingPrice} onChangeText={setStartingPrice} keyboardType="decimal-pad" placeholder="e.g. 150" />
          <Text variant="small" tone="muted">
            Optional — shown to customers as “From GHS {startingPrice.trim() || "150"}.00”.
          </Text>
        </View>

        <TextField label="Description (optional)" value={description} onChangeText={setDescription} placeholder="What's included in this service" />

        {mutation.isError ? (
          <Text variant="small" tone="error">
            {friendlyErrorMessage(mutation.error)}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.modalFooter, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
        <Button
          label={mutation.isPending ? "Saving…" : state.mode === "edit" ? "Save changes" : "Add service"}
          onPress={onSave}
          disabled={!canSave || mutation.isPending}
          loading={mutation.isPending}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function stateKey(state: ServiceFormState): string {
  return state.mode === "edit" ? `edit:${state.service.id}` : "create";
}

export function RequestsSection() {
  const requestsQuery = useVendorServiceRequests(true);
  const accept = useAcceptServiceRequest();
  const decline = useDeclineServiceRequest();
  const rows = requestsQuery.data?.pages.flatMap((p) => p.rows) ?? [];
  const { colors } = useAppTheme();

  return (
    <View style={styles.section}>
      {rows.length === 0 && !requestsQuery.isPending ? null : (
        <Text variant="sectionHeading" tone="primary">
          Service requests
        </Text>
      )}
      {requestsQuery.isPending ? (
        <Skeleton height={60} radius={Radius.lg} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No service requests yet"
          message="When customers request one of your services, you'll see it here."
        />
      ) : (
        rows.map((request) => {
          const info = vendorStatus.serviceRequest(request.status);
          return (
            <Pressable
              key={request.id}
              onPress={() => router.push({ pathname: "/vendor-beauty-professional/requests/[id]", params: { id: request.id } })}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.flex}>
                <Text variant="bodyMedium" tone="primary">
                  {request.service.name}
                </Text>
                <Text variant="small" tone="secondary">
                  {new Date(request.preferredDate).toLocaleDateString()} · {request.customer.name}
                </Text>
              </View>
              {request.status === "SUBMITTED" ? (
                <View style={styles.requestActions}>
                  <Pressable onPress={() => accept.mutate(request.id)} hitSlop={8}>
                    <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                  </Pressable>
                  <Pressable onPress={() => decline.mutate({ id: request.id })} hitSlop={8}>
                    <Ionicons name="close-circle" size={26} color={colors.error} />
                  </Pressable>
                </View>
              ) : (
                <StatusBadge label={info.label} tone={info.tone} />
              )}
            </Pressable>
          );
        })
      )}
      {requestsQuery.hasNextPage ? (
        <Button label={requestsQuery.isFetchingNextPage ? "Loading…" : "Load more"} variant="outline" onPress={() => requestsQuery.fetchNextPage()} disabled={requestsQuery.isFetchingNextPage} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: Spacing.md, gap: Spacing.sm },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.xs },
  badgeRow: { flexDirection: "row" },
  heroPicker: { alignSelf: "flex-start" },
  heroImage: { width: 96, height: 96, borderRadius: Radius.lg },
  heroPlaceholder: { width: 96, height: 96, borderRadius: Radius.lg, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  card: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xs },
  marginTop: { marginTop: Spacing.xs },
  flex: { flex: 1 },
  requestActions: { flexDirection: "row", gap: Spacing.sm },
  gapSm: { gap: Spacing.xs },
  serviceCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.xxs },
  serviceCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  priceText: { marginTop: 2 },
  serviceCardActions: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: { flexDirection: "row", alignItems: "center", gap: Spacing.xxs, minHeight: TouchTarget, paddingVertical: Spacing.xs },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  modalContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  modalFooter: { padding: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
