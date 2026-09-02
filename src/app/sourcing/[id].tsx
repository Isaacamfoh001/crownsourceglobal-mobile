import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { SourcingStatusBadge } from "@/components/ui/SourcingStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useSourcingRequestDetail } from "@/features/sourcing/useSourcingRequests";
import { attachmentImageSource } from "@/lib/media/attachmentImageSource";
import { friendlyErrorMessage } from "@/lib/api/errors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Sourcing request tracker (M24) — a consumer request-tracking screen, not an admin record view. */
export default function SourcingRequestDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useSourcingRequestDetail(id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const request = query.data;
  const images = request?.attachments.filter((a) => a.isImage) ?? [];
  const imageHeight = SCREEN_WIDTH / (4 / 3);

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sectionHeading" tone="primary">
          Sourcing request
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {query.isPending ? (
        <View style={styles.loadingBlock}>
          <Skeleton height={SCREEN_WIDTH * 0.75} />
          <Skeleton height={20} width="60%" style={styles.gap} />
          <Skeleton height={16} width="90%" style={styles.gap} />
        </View>
      ) : query.isError || !request ? (
        <ErrorState title="Couldn't load this request" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {images.length > 0 ? (
            <View>
              <FlatList
                data={images}
                keyExtractor={(a) => a.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
                renderItem={({ item }) => (
                  <Image source={attachmentImageSource(item.url)} style={{ width: SCREEN_WIDTH, height: imageHeight }} contentFit="cover" transition={150} />
                )}
                style={styles.fullBleed}
              />
              {images.length > 1 ? (
                <View style={styles.imageCounter}>
                  <Text variant="caption" tone="inverse">
                    {activeImageIndex + 1}/{images.length}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.noImage, { backgroundColor: colors.surfaceSubtle, height: imageHeight }]}>
              <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant="cardTitle" tone="primary" style={styles.flex}>
                {request.title}
              </Text>
              <SourcingStatusBadge status={request.status} label={request.statusLabel} />
            </View>
            <Text variant="small" tone="muted">
              {request.requestNumber} · Submitted {formatDate(request.submittedAt)}
            </Text>

            {request.status === "UNABLE_TO_SOURCE" && request.unableToSourceReason ? (
              <View style={[styles.noticeCard, { backgroundColor: colors.surfaceSubtle }]}>
                <Text variant="small" tone="secondary">
                  {request.unableToSourceReason}
                </Text>
              </View>
            ) : null}

            {request.latestQuotation ? (
              <Pressable
                onPress={() => router.push(`/quotations/${request.latestQuotation!.id}`)}
                style={[styles.quoteCard, { backgroundColor: colors.goldSurface }]}
                accessibilityRole="button"
              >
                <View style={styles.flex}>
                  <Text variant="bodyMedium" tone="primary">
                    Your quotation is ready
                  </Text>
                  <Text variant="small" tone="secondary">
                    {request.latestQuotation.reference} · {request.latestQuotation.currency} {request.latestQuotation.total.toFixed(2)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            ) : null}

            {request.description ? (
              <View style={styles.section}>
                <Text variant="smallMedium" tone="secondary" style={styles.sectionLabel}>
                  DESCRIPTION
                </Text>
                <Text variant="body" tone="primary">
                  {request.description}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text variant="small" tone="muted">
                  Quantity
                </Text>
                <Text variant="bodyMedium" tone="primary">
                  {request.quantity} {request.quantityUnit ?? ""}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="small" tone="muted">
                  Delivery
                </Text>
                <Text variant="bodyMedium" tone="primary">
                  {[request.deliveryCity, request.deliveryRegion, request.deliveryCountry].filter(Boolean).join(", ")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: 24 },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingBottom: Spacing.xxl },
  fullBleed: { marginHorizontal: -Spacing.md },
  imageCounter: {
    position: "absolute",
    right: Spacing.sm,
    bottom: Spacing.sm,
    backgroundColor: "rgba(20,16,24,0.6)",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  noImage: { alignItems: "center", justifyContent: "center", marginHorizontal: -Spacing.md },
  body: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.xxs },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  noticeCard: { borderRadius: Radius.lg, padding: Spacing.sm, marginTop: Spacing.sm },
  quoteCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: Radius.lg, padding: Spacing.sm, marginTop: Spacing.sm, gap: Spacing.sm },
  section: { marginTop: Spacing.lg },
  sectionLabel: { marginBottom: Spacing.xxs, letterSpacing: 0.5 },
  detailGrid: { flexDirection: "row", gap: Spacing.lg, marginTop: Spacing.lg },
  detailItem: { gap: 2 },
});
