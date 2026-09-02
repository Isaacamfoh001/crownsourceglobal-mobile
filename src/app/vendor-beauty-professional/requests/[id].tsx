import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVendorModeGuard } from "@/hooks/useVendorModeGuard";
import { useVendorServiceRequestDetail, useAcceptServiceRequest, useDeclineServiceRequest } from "@/features/vendor/useVendorBeautyProfessional";
import { vendorStatus } from "@/lib/vendorStatus";
import { friendlyErrorMessage } from "@/lib/api/errors";

/** No direct contact detail is ever shown here — CrownSourceGlobal stays the intermediary (M27 §16/§18). */
export default function VendorServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { ready } = useVendorModeGuard();
  const query = useVendorServiceRequestDetail(ready ? id : undefined);
  const accept = useAcceptServiceRequest();
  const decline = useDeclineServiceRequest();

  if (!ready) return null;

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Skeleton height={140} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState title="Couldn't load this request" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const request = query.data;
  const info = vendorStatus.serviceRequest(request.status);

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          {request.service.name}
        </Text>
      </View>

      <View style={styles.section}>
        <StatusBadge label={info.label} tone={info.tone} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row label="Customer" value={request.customer.name} />
          <Row label="Preferred date" value={new Date(request.preferredDate).toLocaleDateString()} />
          {request.preferredTimeNote ? <Row label="Preferred time" value={request.preferredTimeNote} /> : null}
          <Row label="Location" value={request.locationMode === "PROVIDER_LOCATION" ? "At my location" : "At customer's location"} />
          {request.locationDetails ? <Row label="Details" value={request.locationDetails} /> : null}
          <Row label="Quantity" value={String(request.quantity)} />
          {request.notes ? <Row label="Notes" value={request.notes} /> : null}
        </View>

        {request.referenceImage ? <Image source={{ uri: request.referenceImage }} style={styles.referenceImage} contentFit="cover" /> : null}

        {request.status === "SUBMITTED" ? (
          <View style={styles.actionRow}>
            <Button
              label={accept.isPending ? "Accepting…" : "Accept"}
              onPress={() => accept.mutate(request.id)}
              disabled={accept.isPending}
              loading={accept.isPending}
              style={styles.flex}
            />
            <Button
              label="Decline"
              variant="outline"
              onPress={() =>
                Alert.alert("Decline request?", undefined, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Decline", style: "destructive", onPress: () => decline.mutate({ id: request.id }) },
                ])
              }
              disabled={decline.isPending}
              style={styles.flex}
            />
          </View>
        ) : null}

        {request.declineReason ? (
          <Text variant="small" tone="secondary">
            Decline reason: {request.declineReason}
          </Text>
        ) : null}

        {accept.isError || decline.isError ? (
          <Text variant="small" tone="error">
            {friendlyErrorMessage(accept.error ?? decline.error)}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
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
  loading: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  section: { padding: Spacing.md, gap: Spacing.sm },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between" },
  referenceImage: { width: "100%", height: 200, borderRadius: Radius.lg },
  actionRow: { flexDirection: "row", gap: Spacing.sm },
  flex: { flex: 1 },
});
