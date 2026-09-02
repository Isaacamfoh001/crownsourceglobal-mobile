import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useExploreCategories } from "@/features/explore/useExploreCategories";
import { useCategories } from "@/features/categories/useCategories";
import { prepareImage } from "@/lib/media/prepareImage";
import { vendorStatus } from "@/lib/vendorStatus";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import {
  useVendorBeautyProfile,
  useSaveVendorBeautyProfile,
  useVendorServices,
  useCreateVendorService,
  useToggleVendorServiceActive,
  useVendorServiceRequests,
  useAcceptServiceRequest,
  useDeclineServiceRequest,
} from "@/features/vendor/useVendorBeautyProfessional";

const LOCATION_MODES = [
  { value: "PROVIDER_LOCATION", label: "My location" },
  { value: "CUSTOMER_LOCATION", label: "Customer's location" },
  { value: "BOTH", label: "Both" },
] as const;

export default function VendorBeautyProfessionalScreen() {
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorBeautyProfile(ready);

  if (!ready) return null;

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={160} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState title="Couldn't load your profile" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            Beauty Professional
          </Text>
        </View>

        <ProfileForm profile={query.data} />

        {query.data ? (
          <>
            <ServicesSection />
            <RequestsSection />
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function ProfileForm({ profile }: { profile: ReturnType<typeof useVendorBeautyProfile>["data"] }) {
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

function ServicesSection() {
  const { colors } = useAppTheme();
  const servicesQuery = useVendorServices(true);
  const categoriesQuery = useCategories();
  const createService = useCreateVendorService();
  const toggleActive = useToggleVendorServiceActive();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [startingPrice, setStartingPrice] = useState("");

  const onAdd = () => {
    if (!name.trim() || !categoryId || createService.isPending) return;
    createService.mutate(
      { name, categoryId, startingPrice: startingPrice || undefined },
      { onSuccess: () => { setAdding(false); setName(""); setStartingPrice(""); } },
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text variant="sectionHeading" tone="primary">
          Services
        </Text>
        <Pressable onPress={() => setAdding((v) => !v)}>
          <Ionicons name={adding ? "close" : "add-circle-outline"} size={22} color={colors.pink} />
        </Pressable>
      </View>

      {adding ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextField label="Service name" value={name} onChangeText={setName} />
          <TextField label="Starting price (GHS, optional)" value={startingPrice} onChangeText={setStartingPrice} keyboardType="decimal-pad" />
          <Text variant="smallMedium" tone="secondary">
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {(categoriesQuery.data?.categories ?? []).map((category) => (
              <CategoryTile key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
            ))}
          </ScrollView>
          {createService.isError ? (
            <Text variant="small" tone="error">
              {friendlyErrorMessage(createService.error)}
            </Text>
          ) : null}
          <Button label={createService.isPending ? "Adding…" : "Add service"} onPress={onAdd} disabled={createService.isPending} loading={createService.isPending} fullWidth style={styles.marginTop} />
        </View>
      ) : null}

      {servicesQuery.isPending ? (
        <Skeleton height={60} radius={Radius.lg} />
      ) : (
        (servicesQuery.data ?? []).map((service) => (
          <View key={service.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text variant="bodyMedium" tone="primary">
                {service.name}
              </Text>
              <Text variant="small" tone="secondary">
                {service.startingPrice ? `From ${formatMoney(service.startingPrice)}` : "No starting price set"}
              </Text>
            </View>
            <Pressable onPress={() => toggleActive.mutate({ serviceId: service.id, active: !service.active })}>
              <StatusBadge label={service.active ? "Active" : "Hidden"} tone={service.active ? "success" : "muted"} />
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

function RequestsSection() {
  const { colors } = useAppTheme();
  const requestsQuery = useVendorServiceRequests(true);
  const accept = useAcceptServiceRequest();
  const decline = useDeclineServiceRequest();
  const rows = requestsQuery.data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <View style={styles.section}>
      <Text variant="sectionHeading" tone="primary">
        Service requests
      </Text>
      {requestsQuery.isPending ? (
        <Skeleton height={60} radius={Radius.lg} />
      ) : rows.length === 0 ? (
        <Text variant="small" tone="muted">
          No requests yet.
        </Text>
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
  flex: { flex: 1 },
  loading: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  section: { padding: Spacing.md, gap: Spacing.sm },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badgeRow: { flexDirection: "row" },
  heroPicker: { alignSelf: "flex-start" },
  heroImage: { width: 96, height: 96, borderRadius: Radius.lg },
  heroPlaceholder: { width: 96, height: 96, borderRadius: Radius.lg, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  card: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xs },
  marginTop: { marginTop: Spacing.xs },
  requestActions: { flexDirection: "row", gap: Spacing.sm },
});
