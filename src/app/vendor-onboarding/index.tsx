import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { PickerModal } from "@/components/ui/PickerModal";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/features/categories/useCategories";
import { COUNTRIES } from "@/constants/countries";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import {
  useVendorApplication,
  useSaveSellerType,
  useSaveContact,
  useSaveBusiness,
  useSaveOperations,
  useSubmitApplication,
} from "@/features/vendor/useVendorApplication";

/**
 * M32.6 — the one `VendorApplication` wizard (M27 §4/§5) now serves three
 * distinct onboarding journeys (Seller / Factory-Manufacturer / Beauty
 * prerequisite) off a single `?type=` param, per pathway-specific copy,
 * fields and defaults below. Same backend draft, same status machine, same
 * `sellerType` enum throughout — only the presentation and defaults differ
 * per pathway, never the domain model.
 */
export type OnboardingType = "seller" | "manufacturer" | "beauty";

function normalizeType(raw: string | undefined): OnboardingType {
  return raw === "manufacturer" || raw === "beauty" ? raw : "seller";
}

const ALL_SELLER_TYPES = [
  { value: "INDIVIDUAL", label: "Individual / Independent Seller", description: "You sell on your own, without a registered business." },
  { value: "SOLE_TRADER", label: "Entrepreneur / Sole Trader", description: "You run a small operation, registered or not." },
  { value: "REGISTERED_BUSINESS", label: "Registered Business / Company", description: "An incorporated or formally registered company." },
  { value: "DISTRIBUTOR_WHOLESALER", label: "Distributor / Wholesaler", description: "You supply other businesses in bulk." },
  { value: "MANUFACTURER", label: "Manufacturer", description: "You produce the goods you sell." },
  { value: "ORGANIZATION", label: "Organization / Institution", description: "A cooperative, NGO, or other institution." },
  { value: "OTHER", label: "Other", description: "None of the above quite fits." },
] as const;

// Factory has its own pathway now, so it's pre-set there rather than picked
// from the Seller list; Distributor/Wholesaler and Manufacturer don't apply
// to an individual beauty professional.
const SELLER_TYPE_OPTIONS: Record<OnboardingType, (typeof ALL_SELLER_TYPES)[number][]> = {
  seller: ALL_SELLER_TYPES.filter((t) => t.value !== "MANUFACTURER"),
  manufacturer: [],
  beauty: ALL_SELLER_TYPES.filter((t) => t.value !== "DISTRIBUTOR_WHOLESALER" && t.value !== "MANUFACTURER"),
};

const REGISTRATION_RELEVANT: string[] = ["REGISTERED_BUSINESS", "DISTRIBUTOR_WHOLESALER", "MANUFACTURER", "ORGANIZATION"];

const EDITABLE_STATUSES = new Set(["DRAFT", "CHANGES_REQUESTED", "REJECTED"]);

type PathwayConfig = {
  wizardTitle: string;
  steps: string[];
  signedOutTitle: string;
  signedOutMessage: string;
  sellerTypeIntro: string;
  businessNameLabel: string;
  businessDescriptionLabel: string;
  businessDescriptionPlaceholder: string;
  categoryPrompt: string;
  showSellingMode: boolean;
  approvedTitle: string;
  approvedMessage: string;
};

const PATHWAY: Record<OnboardingType, PathwayConfig> = {
  seller: {
    wizardTitle: "Seller application",
    steps: ["Seller type", "Contact", "Your store", "Your products", "Review"],
    signedOutTitle: "Start selling on CrownSource",
    signedOutMessage: "Sign in or create an account to start your seller application.",
    sellerTypeIntro: "What kind of seller are you?",
    businessNameLabel: "Store / business name",
    businessDescriptionLabel: "Tell customers about your store",
    businessDescriptionPlaceholder: "What you sell and what makes your store worth buying from",
    categoryPrompt: "What do you sell?",
    showSellingMode: true,
    approvedTitle: "You're approved!",
    approvedMessage: "Your store is live. Open Vendor Mode from your Account tab to get started.",
  },
  manufacturer: {
    wizardTitle: "Manufacturer application",
    steps: ["Manufacturer", "Contact", "Your factory", "What you make", "Review"],
    signedOutTitle: "Join CrownSource as a manufacturer",
    signedOutMessage: "Sign in or create an account to start your manufacturer application.",
    sellerTypeIntro: "You're applying as a Manufacturer / Factory.",
    businessNameLabel: "Factory / company name",
    businessDescriptionLabel: "Tell us about your factory",
    businessDescriptionPlaceholder: "What you manufacture and your production capabilities",
    categoryPrompt: "What do you manufacture?",
    showSellingMode: true,
    approvedTitle: "You're approved!",
    approvedMessage: "Your factory account is live. Open Vendor Mode from your Account tab to see sourcing requests.",
  },
  beauty: {
    wizardTitle: "Beauty professional application",
    steps: ["About you", "Contact", "Your business", "Business category", "Review"],
    signedOutTitle: "Offer your beauty services",
    signedOutMessage: "Sign in or create an account to create your beauty professional profile.",
    sellerTypeIntro: "How do you operate?",
    businessNameLabel: "Professional / business name",
    businessDescriptionLabel: "Tell clients about you",
    businessDescriptionPlaceholder: "Your experience and the services you're known for",
    categoryPrompt: "Business category",
    showSellingMode: false,
    approvedTitle: "You're approved!",
    approvedMessage: "Now let's set up your beauty professional profile.",
  },
};

function redirectTarget(type: OnboardingType): string {
  return `/vendor-onboarding?type=${type}`;
}

export default function VendorOnboardingScreen() {
  const { colors } = useAppTheme();
  const { status: authStatus } = useAuth();
  const params = useLocalSearchParams<{ type?: string }>();
  const type = normalizeType(params.type);
  const pathway = PATHWAY[type];
  const query = useVendorApplication(authStatus === "SIGNED_IN");

  if (authStatus !== "SIGNED_IN") {
    return (
      <Screen edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.introContainer}>
          <Text variant="screenTitle" tone="primary" style={styles.center}>
            {pathway.signedOutTitle}
          </Text>
          <Text variant="body" tone="secondary" style={styles.center}>
            {pathway.signedOutMessage}
          </Text>
          <View style={styles.introActions}>
            <Button
              label="Sign in to continue"
              onPress={() => router.push({ pathname: "/(auth)/sign-in", params: { redirect: redirectTarget(type) } })}
              fullWidth
            />
            <Button
              label="Create an account to continue"
              variant="outline"
              onPress={() => router.push({ pathname: "/(auth)/sign-up", params: { redirect: redirectTarget(type) } })}
              fullWidth
            />
          </View>
        </View>
      </Screen>
    );
  }

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={20} width={200} radius={Radius.sm} />
          <Skeleton height={140} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState title="Couldn't load your application" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const application = query.data;
  const beautyReadyToContinue = type === "beauty" && application.status === "APPROVED";

  return (
    <VendorOnboardingBody type={type} pathway={pathway} application={application} beautyReadyToContinue={beautyReadyToContinue} />
  );
}

function VendorOnboardingBody({
  type,
  pathway,
  application,
  beautyReadyToContinue,
}: {
  type: OnboardingType;
  pathway: PathwayConfig;
  application: NonNullable<ReturnType<typeof useVendorApplication>["data"]>;
  beautyReadyToContinue: boolean;
}) {
  const { colors } = useAppTheme();

  // Beauty's prerequisite is simply an approved Vendor — once that's true,
  // move straight into the real Beauty profile setup instead of a dead-end
  // status card (M32.6 §5/§9). A navigation side effect belongs in an
  // effect, not the render body, matching useVendorModeGuard's convention.
  // An already-approved Seller/Vendor landing on the first-time manufacturer
  // wizard (e.g. a stale deep link) has a real upgrade path now — M32.8's
  // short manufacturer-application screen — never the old "not supported
  // yet" dead-end (M32.8.1 §1/§6). Normal navigation (welcome.tsx,
  // switch-experience.tsx) already routes an existing Vendor there directly
  // and never reaches this wizard at all; this is just the safety net.
  const manufacturerUpgradeNeeded = type === "manufacturer" && application.status === "APPROVED" && application.sellerType !== "MANUFACTURER";

  useEffect(() => {
    if (beautyReadyToContinue) router.replace("/vendor-beauty-professional");
    if (manufacturerUpgradeNeeded) router.replace("/manufacturer-upgrade");
  }, [beautyReadyToContinue, manufacturerUpgradeNeeded]);

  if (beautyReadyToContinue || manufacturerUpgradeNeeded) return null;

  if (!EDITABLE_STATUSES.has(application.status)) {
    const info = vendorStatus.application(application.status);
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.statusContainer}>
          <StatusBadge label={info.label} tone={info.tone} />
          <Text variant="screenTitle" tone="primary" style={styles.center}>
            {application.status === "APPROVED" ? pathway.approvedTitle : "Application received"}
          </Text>
          <Text variant="body" tone="secondary" style={styles.center}>
            {application.status === "SUBMITTED" || application.status === "UNDER_REVIEW"
              ? "CrownSourceGlobal is reviewing your application. We'll notify you once there's a decision."
              : application.status === "APPROVED"
                ? pathway.approvedMessage
                : "This application has been reviewed."}
          </Text>
          <Button label="Done" onPress={() => router.back()} style={styles.doneButton} />
        </View>
      </Screen>
    );
  }

  return <OnboardingWizard type={type} pathway={pathway} />;
}

function OnboardingWizard({ type, pathway }: { type: OnboardingType; pathway: PathwayConfig }) {
  const { colors } = useAppTheme();
  const query = useVendorApplication(true);
  const app = query.data;

  const sellerTypeOptions = SELLER_TYPE_OPTIONS[type];
  const fixedSellerType = type === "manufacturer" ? "MANUFACTURER" : undefined;

  const [step, setStep] = useState(0);
  const [sellerType, setSellerType] = useState<string | undefined>(fixedSellerType ?? app?.sellerType ?? undefined);
  const [contactName, setContactName] = useState(app?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(app?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(app?.contactPhone ?? "");
  const [displayName, setDisplayName] = useState(app?.displayName ?? "");
  const [legalName, setLegalName] = useState(app?.legalName ?? "");
  const [storeDescription, setStoreDescription] = useState(app?.storeDescription ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(app?.registrationNumber ?? "");
  const [country, setCountry] = useState(app?.country ?? "");
  const [region, setRegion] = useState(app?.region ?? "");
  const [city, setCity] = useState(app?.city ?? "");
  const [addressLine1, setAddressLine1] = useState(app?.addressLine1 ?? "");
  const [categorySlugs, setCategorySlugs] = useState<string[]>(app?.categorySlugs ?? []);
  const [categoryOther, setCategoryOther] = useState(app?.categoryOther ?? "");
  const [otherSelected, setOtherSelected] = useState(Boolean(app?.categoryOther));
  const [sellingMode, setSellingMode] = useState<string>(app?.sellingMode ?? (type === "manufacturer" ? "wholesale" : "retail"));
  const [bulkCapable, setBulkCapable] = useState(app?.bulkCapable ?? type === "manufacturer");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const categoriesQuery = useCategories();
  const saveSellerType = useSaveSellerType();
  const saveContact = useSaveContact();
  const saveBusiness = useSaveBusiness();
  const saveOperations = useSaveOperations();
  const submitApplication = useSubmitApplication();

  const pending =
    saveSellerType.isPending || saveContact.isPending || saveBusiness.isPending || saveOperations.isPending || submitApplication.isPending;
  const currentError =
    saveSellerType.error ?? saveContact.error ?? saveBusiness.error ?? saveOperations.error ?? submitApplication.error;

  const goNext = () => setStep((s) => Math.min(s + 1, pathway.steps.length - 1));
  const goBack = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const onContinue = () => {
    if (step === 0) {
      if (!sellerType) return;
      saveSellerType.mutate({ sellerType }, { onSuccess: goNext });
    } else if (step === 1) {
      if (!contactName.trim() || !contactPhone.trim()) return;
      saveContact.mutate({ contactName, contactEmail: contactEmail.trim() || undefined, contactPhone }, { onSuccess: goNext });
    } else if (step === 2) {
      if (!displayName.trim() || storeDescription.trim().length < 10 || !country.trim() || !region.trim() || !city.trim() || !addressLine1.trim()) return;
      if (REGISTRATION_RELEVANT.includes(sellerType ?? "") && !registrationNumber.trim()) return;
      saveBusiness.mutate(
        {
          displayName,
          legalName: legalName || undefined,
          storeDescription,
          registrationNumber: registrationNumber || undefined,
          country,
          region,
          city,
          addressLine1,
        },
        { onSuccess: goNext },
      );
    } else if (step === 3) {
      const trimmedOther = categoryOther.trim();
      if (categorySlugs.length === 0 && !trimmedOther) return;
      saveOperations.mutate(
        { categorySlugs, categoryOther: trimmedOther || undefined, sellingMode: sellingMode as "retail" | "wholesale" | "both", bulkCapable },
        { onSuccess: goNext },
      );
    } else {
      submitApplication.mutate(undefined, {
        onSuccess: () => {
          router.replace({ pathname: "/vendor-onboarding", params: { type } });
        },
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
            <Ionicons name={step === 0 ? "close" : "arrow-back"} size={24} color={colors.textPrimary} />
          </Pressable>
          <Text variant="sectionHeading" tone="primary">
            {pathway.wizardTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.stepRow}>
          {pathway.steps.map((label, index) => (
            <View key={label} style={[styles.stepDot, { backgroundColor: index <= step ? colors.pink : colors.border }]} />
          ))}
        </View>
        <Text variant="small" tone="muted" style={styles.stepLabel}>
          Step {step + 1} of {pathway.steps.length} · {pathway.steps[step]}
        </Text>

        <View style={styles.content}>
          {step === 0 && (
            <View style={styles.fieldGroup}>
              <Text variant="body" tone="secondary">
                {pathway.sellerTypeIntro}
              </Text>
              {fixedSellerType ? (
                <View style={[styles.optionRow, { borderColor: colors.pink, backgroundColor: colors.surface }]}>
                  <View style={styles.flex}>
                    <Text variant="bodyMedium" tone="primary">
                      Manufacturer
                    </Text>
                    <Text variant="small" tone="secondary">
                      You produce the goods you supply.
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={colors.pink} />
                </View>
              ) : (
                sellerTypeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSellerType(option.value)}
                    style={[
                      styles.optionRow,
                      { borderColor: sellerType === option.value ? colors.pink : colors.border, backgroundColor: colors.surface },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sellerType === option.value }}
                  >
                    <View style={styles.flex}>
                      <Text variant="bodyMedium" tone="primary">
                        {option.label}
                      </Text>
                      <Text variant="small" tone="secondary">
                        {option.description}
                      </Text>
                    </View>
                    <Ionicons
                      name={sellerType === option.value ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={sellerType === option.value ? colors.pink : colors.textMuted}
                    />
                  </Pressable>
                ))
              )}
            </View>
          )}

          {step === 1 && (
            <View style={styles.fieldGroup}>
              <TextField label="Your name" value={contactName} onChangeText={setContactName} autoCapitalize="words" />
              <TextField label="Contact email (optional)" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />
              <TextField label="Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
            </View>
          )}

          {step === 2 && (
            <View style={styles.fieldGroup}>
              <TextField label={pathway.businessNameLabel} value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
              <TextField label="Legal name (optional)" value={legalName} onChangeText={setLegalName} autoCapitalize="words" />
              <View style={styles.fieldWrap}>
                <Text variant="smallMedium" tone="secondary">
                  {pathway.businessDescriptionLabel}
                </Text>
                <TextInput
                  value={storeDescription}
                  onChangeText={setStoreDescription}
                  multiline
                  placeholder={pathway.businessDescriptionPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.multiline, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
                />
              </View>
              {REGISTRATION_RELEVANT.includes(sellerType ?? "") ? (
                <TextField label="Business registration number" value={registrationNumber} onChangeText={setRegistrationNumber} />
              ) : null}
              <Pressable onPress={() => setCountryPickerOpen(true)} style={styles.fieldWrap}>
                <Text variant="smallMedium" tone="secondary">
                  Country
                </Text>
                <View style={[styles.pickerField, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text variant="body" tone={country ? "primary" : "muted"}>
                    {country || "Select a country"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </View>
              </Pressable>
              <TextField label="Region / state" value={region} onChangeText={setRegion} />
              <TextField label="City" value={city} onChangeText={setCity} />
              <TextField label="Address" value={addressLine1} onChangeText={setAddressLine1} />
            </View>
          )}

          {step === 3 && (
            <View style={styles.fieldGroup}>
              <Text variant="smallMedium" tone="secondary">
                {pathway.categoryPrompt}
              </Text>
              {type === "beauty" ? (
                <Text variant="small" tone="muted">
                  Helps us route your application — you&apos;ll choose your specific service specialties next, once you&apos;re approved.
                </Text>
              ) : null}
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
                      selected={categorySlugs.includes(category.slug)}
                      onPress={() =>
                        setCategorySlugs((current) =>
                          current.includes(category.slug) ? current.filter((s) => s !== category.slug) : [...current, category.slug],
                        )
                      }
                    />
                  ))}
                  <CategoryTile label="Other / Not listed" selected={otherSelected} onPress={() => setOtherSelected((v) => !v)} />
                </View>
              )}

              {otherSelected ? (
                <TextField label={pathway.categoryPrompt} value={categoryOther} onChangeText={setCategoryOther} />
              ) : null}

              {pathway.showSellingMode ? (
                <>
                  <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
                    Selling mode
                  </Text>
                  <View style={styles.categoryRow}>
                    {(["retail", "wholesale", "both"] as const).map((mode) => (
                      <CategoryTile key={mode} label={mode[0].toUpperCase() + mode.slice(1)} selected={sellingMode === mode} onPress={() => setSellingMode(mode)} />
                    ))}
                  </View>

                  <Pressable onPress={() => setBulkCapable((v) => !v)} style={[styles.optionRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <Text variant="body" tone="primary" style={styles.flex}>
                      I can fulfil bulk/wholesale orders
                    </Text>
                    <Ionicons name={bulkCapable ? "checkbox" : "square-outline"} size={20} color={bulkCapable ? colors.pink : colors.textMuted} />
                  </Pressable>
                </>
              ) : null}
            </View>
          )}

          {step === 4 && (
            <View style={styles.fieldGroup}>
              <ReviewRow label={type === "manufacturer" ? "Type" : "Seller type"} value={fixedSellerType ? "Manufacturer" : ALL_SELLER_TYPES.find((t) => t.value === sellerType)?.label ?? ""} />
              <ReviewRow label="Contact" value={[contactName, contactEmail, contactPhone].filter(Boolean).join(" · ")} />
              <ReviewRow label={type === "seller" ? "Store" : type === "manufacturer" ? "Factory" : "Business"} value={displayName} />
              <ReviewRow label="Location" value={`${addressLine1}, ${city}, ${region}, ${country}`} />
              <ReviewRow label="Categories" value={[...categorySlugs, ...(categoryOther ? [categoryOther] : [])].join(", ")} />
              {pathway.showSellingMode ? <ReviewRow label="Selling mode" value={sellingMode} /> : null}
              <Text variant="small" tone="muted">
                Submitting sends your application to CrownSourceGlobal for review. You&apos;ll be notified once there&apos;s a decision.
              </Text>
            </View>
          )}

          {currentError ? (
            <Text variant="small" tone="error" style={styles.errorText}>
              {friendlyErrorMessage(currentError)}
            </Text>
          ) : null}

          <Button
            label={step === pathway.steps.length - 1 ? (submitApplication.isPending ? "Submitting…" : "Submit application") : "Continue"}
            onPress={onContinue}
            loading={pending}
            disabled={pending}
            fullWidth
            style={styles.continueButton}
          />
        </View>
      </Screen>

      <PickerModal
        visible={countryPickerOpen}
        title="Country"
        options={COUNTRIES}
        selected={country || null}
        onSelect={setCountry}
        onClose={() => setCountryPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="body" tone="primary">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  stepRow: { flexDirection: "row", gap: 4, paddingHorizontal: Spacing.md },
  stepDot: { flex: 1, height: 3, borderRadius: 2 },
  stepLabel: { paddingHorizontal: Spacing.md, marginTop: Spacing.xs },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  fieldGroup: { gap: Spacing.sm },
  fieldWrap: { gap: Spacing.xxs },
  multiline: { minHeight: 90, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, fontSize: 14, textAlignVertical: "top" },
  pickerField: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  sectionLabel: { marginTop: Spacing.sm },
  errorText: {},
  continueButton: { marginTop: Spacing.sm },
  reviewRow: { gap: 2 },
  loading: { padding: Spacing.md, gap: Spacing.md },
  statusContainer: { alignItems: "center", padding: Spacing.xl, gap: Spacing.sm },
  introContainer: { alignItems: "center", padding: Spacing.xl, gap: Spacing.sm },
  introActions: { alignSelf: "stretch", gap: Spacing.sm, marginTop: Spacing.lg },
  center: { textAlign: "center" },
  doneButton: { marginTop: Spacing.lg, alignSelf: "stretch" },
});
