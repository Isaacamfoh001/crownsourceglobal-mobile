import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useExperience } from "@/hooks/useExperience";
import { useCategories } from "@/features/categories/useCategories";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useManufacturerApplication, useSubmitManufacturerApplication } from "@/features/vendor/useManufacturerApplication";
import type { ManufacturerApplicationDTO } from "@/types/api";

const PENDING_STATUSES = new Set(["SUBMITTED", "UNDER_REVIEW"]);

/**
 * M32.8.1 — the short Seller → Manufacturer upgrade application. Reachable
 * only by an already-approved Vendor without Factory access yet
 * (welcome.tsx and switch-experience.tsx route here instead of the
 * first-time `/vendor-onboarding?type=manufacturer` wizard once the account
 * is already a Vendor — see those files, and vendor-onboarding/index.tsx's
 * own redirect for anyone who lands there directly). This replaces the old
 * "Manufacturer access isn't available yet" dead-end entirely.
 *
 * Deliberately NOT a wizard: one category step, reusing everything
 * CrownSource already knows about the Vendor (name, location) rather than
 * re-asking it — same convention as vendor-beauty-professional's profile
 * form, and matching the backend's single-step PATCH (M32.8 — no separate
 * draft-save endpoint).
 */
export default function ManufacturerUpgradeScreen() {
  const { ready } = useVendorModeGuard();
  const { me } = useAuth();
  const { setExperience } = useExperience();
  const query = useManufacturerApplication(ready);

  const membership = me?.vendor.memberships[0] ?? null;
  const alreadyAvailable = Boolean(membership?.manufacturer.available) || query.data?.status === "APPROVED";

  // Approved — via this application, or (rare, e.g. a stale cache from a
  // push notification) already sellerType === MANUFACTURER — never shows
  // the application screen; Factory opens directly instead (M32.8.1 §4/§6).
  useEffect(() => {
    if (alreadyAvailable) {
      setExperience("FACTORY");
      router.replace("/(vendor)");
    }
  }, [alreadyAvailable, setExperience]);

  if (!ready || alreadyAvailable) return null;

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={20} width={220} radius={Radius.sm} />
          <Skeleton height={140} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState title="Couldn't load your application" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const application = query.data;

  if (application && PENDING_STATUSES.has(application.status)) {
    return <PendingStatus status={application.status} />;
  }

  return <ApplicationForm application={application} />;
}

function PendingStatus({ status }: { status: string }) {
  const { colors } = useAppTheme();
  const info = vendorStatus.application(status);
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
          Application under review
        </Text>
        <Text variant="body" tone="secondary" style={styles.center}>
          CrownSourceGlobal is reviewing your manufacturer application. We&apos;ll notify you once there&apos;s a decision.
        </Text>
        <Button label="Done" onPress={() => router.back()} style={styles.doneButton} />
      </View>
    </Screen>
  );
}

function ApplicationForm({ application }: { application: ManufacturerApplicationDTO | null }) {
  const { colors } = useAppTheme();
  const categoriesQuery = useCategories();
  const submit = useSubmitManufacturerApplication();

  const [categorySlugs, setCategorySlugs] = useState<string[]>(application?.categorySlugs ?? []);
  const [categoryOther, setCategoryOther] = useState(application?.categoryOther ?? "");
  const [otherSelected, setOtherSelected] = useState(Boolean(application?.categoryOther));

  const decisionInfo = application ? vendorStatus.application(application.status) : null;
  const decisionHeading =
    application?.status === "CHANGES_REQUESTED"
      ? "Changes requested"
      : application?.status === "REJECTED"
        ? "Application not approved"
        : null;

  const trimmedOther = categoryOther.trim();
  const canSubmit = categorySlugs.length > 0 || trimmedOther.length > 0;

  function onSubmit() {
    if (!canSubmit) return;
    submit.mutate({ categorySlugs, categoryOther: trimmedOther || undefined });
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text variant="screenTitle" tone="primary">
          Become a manufacturer on CrownSource
        </Text>
        <Text variant="body" tone="secondary">
          Tell us what you manufacture. Once approved, Factory mode will be added to your account.
        </Text>

        {decisionHeading && decisionInfo ? (
          <View style={[styles.banner, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <StatusBadge label={decisionInfo.label} tone={decisionInfo.tone} />
            <Text variant="bodyMedium" tone="primary">
              {decisionHeading}
            </Text>
            {application?.decisionReason ? (
              <Text variant="body" tone="secondary">
                {application.decisionReason}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text variant="smallMedium" tone="secondary">
            What do you manufacture?
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
                  selected={categorySlugs.includes(category.slug)}
                  onPress={() =>
                    setCategorySlugs((current) =>
                      current.includes(category.slug) ? current.filter((slug) => slug !== category.slug) : [...current, category.slug],
                    )
                  }
                />
              ))}
              <CategoryTile label="Other / Not listed" selected={otherSelected} onPress={() => setOtherSelected((value) => !value)} />
            </View>
          )}

          {otherSelected ? <TextField label="What do you manufacture?" value={categoryOther} onChangeText={setCategoryOther} /> : null}
        </View>

        {submit.isError ? (
          <Text variant="small" tone="error">
            {friendlyErrorMessage(submit.error)}
          </Text>
        ) : null}

        <Button
          label={submit.isPending ? "Submitting…" : "Submit application"}
          onPress={onSubmit}
          disabled={!canSubmit || submit.isPending}
          loading={submit.isPending}
          fullWidth
          style={styles.submitButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  fieldGroup: { gap: Spacing.sm },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  banner: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs },
  submitButton: { marginTop: Spacing.sm },
  loading: { padding: Spacing.md, gap: Spacing.md },
  statusContainer: { alignItems: "center", padding: Spacing.xl, gap: Spacing.sm },
  center: { textAlign: "center" },
  doneButton: { marginTop: Spacing.lg, alignSelf: "stretch" },
});
