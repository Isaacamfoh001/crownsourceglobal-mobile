import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useBeautyProfessionalDetail } from "@/features/beauty-services/useBeautyProfessionalDetail";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { promptSignInRequired } from "@/lib/auth/requireAuthPrompt";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_WIDTH * 0.72;
const PORTFOLIO_GAP = Spacing.xs;
const PORTFOLIO_TILE = (SCREEN_WIDTH - Spacing.md * 2 - PORTFOLIO_GAP * 2) / 3;

/**
 * Beauty Professional detail (M22 §11). "Request Service" is the ONLY
 * contact CTA — no call/WhatsApp/email/DM (M22 §2/§12). Portfolio content
 * is the professional's own approved+published Explore posts, resolved
 * server-side — never a second photo system here.
 */
export default function BeautyProfessionalDetailScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useBeautyProfessionalDetail(id);
  const professional = query.data;
  const { status } = useAuth();

  const heroUri = professional?.heroImageUrl ?? professional?.avatarUrl ?? null;

  const specialtyLabel = useMemo(() => professional?.specialties.map((s) => s.name).join(" · ") ?? "", [professional]);

  /** Request Service requires sign-in (M22 §13) — a signed-out tap prompts sign-in and returns here afterwards, same pattern as Explore's like/save gating. */
  const goToRequest = (serviceId?: string) => {
    if (!id) return;
    const redirectTo = `/beauty-services/request?professionalId=${id}${serviceId ? `&serviceId=${serviceId}` : ""}`;
    if (status === "SIGNED_OUT") {
      promptSignInRequired("request this service", redirectTo);
      return;
    }
    router.push({ pathname: "/beauty-services/request", params: { professionalId: id, ...(serviceId ? { serviceId } : {}) } });
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text variant="cardTitle" tone="primary" numberOfLines={1} style={styles.headerTitle}>
          {professional?.displayName ?? "Professional"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {query.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={HERO_HEIGHT} radius={0} />
          <Skeleton height={22} width="60%" style={styles.gap} />
          <Skeleton height={16} width="40%" style={styles.gap} />
        </View>
      )}

      {query.isError && (
        <ErrorState title="Couldn't load this professional" message={friendlyErrorMessage(query.error)} onRetry={() => query.refetch()} />
      )}

      {professional && (
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroWrap, { backgroundColor: colors.surfaceSubtle }]}>
            <FallbackImage
              uri={heroUri}
              style={styles.hero}
              transition={150}
              fallback={
                <View style={styles.heroFallback}>
                  <Text variant="display" tone="secondary">
                    {professional.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              }
            />
          </View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant="screenTitle" tone="primary" style={styles.titleText}>
                {professional.displayName}
              </Text>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.goldSurface }]}>
                <Ionicons name="shield-checkmark" size={13} color={colors.goldStrong} />
                <Text variant="caption" tone="gold">
                  VERIFIED
                </Text>
              </View>
            </View>

            {specialtyLabel ? (
              <Text variant="body" tone="secondary" style={styles.metaLine}>
                {specialtyLabel}
              </Text>
            ) : null}

            {professional.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text variant="small" tone="muted">
                  {professional.location}
                </Text>
              </View>
            ) : null}

            {professional.bio ? (
              <View style={styles.section}>
                <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
                  About
                </Text>
                <Text variant="body" tone="secondary" style={styles.bio}>
                  {professional.bio}
                </Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
                Services
              </Text>
              {professional.services.length === 0 ? (
                <Text variant="body" tone="secondary">
                  No services listed yet.
                </Text>
              ) : (
                <View style={styles.servicesList}>
                  {professional.services.map((service) => (
                    <Pressable
                      key={service.id}
                      onPress={() => goToRequest(service.id)}
                      style={[styles.serviceRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Request ${service.name}`}
                    >
                      <View style={styles.serviceInfo}>
                        <Text variant="cardTitle" tone="primary" numberOfLines={1}>
                          {service.name}
                        </Text>
                        {service.description ? (
                          <Text variant="small" tone="secondary" numberOfLines={2} style={styles.serviceDescription}>
                            {service.description}
                          </Text>
                        ) : null}
                        {service.startingPrice ? (
                          <Text variant="smallMedium" tone="gold" style={styles.servicePrice}>
                            From GH₵ {Number(service.startingPrice.amount).toFixed(0)}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {professional.portfolio.length > 0 ? (
              <View style={styles.section}>
                <Text variant="sectionHeading" tone="primary" style={styles.sectionTitle}>
                  Portfolio
                </Text>
                <View style={styles.portfolioGrid}>
                  {professional.portfolio.flatMap((post) => post.images.slice(0, 1)).slice(0, 9).map((uri, index) => (
                    <FallbackImage
                      key={`${uri}-${index}`}
                      uri={uri}
                      style={styles.portfolioTile}
                      transition={150}
                      fallback={
                        <View style={[styles.portfolioTile, styles.portfolioTileFallback, { backgroundColor: colors.surfaceSubtle }]}>
                          <Ionicons name="image-outline" size={18} color={colors.textMuted} />
                        </View>
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.footerSpacer} />
          </View>
        </ScrollView>
      )}

      {professional ? (
        <View style={[styles.ctaBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button label="Request Service" onPress={() => goToRequest()} fullWidth />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
  headerSpacer: { width: TouchTarget },
  headerTitle: { flex: 1, textAlign: "center" },
  loadingBlock: { padding: Spacing.md },
  gap: { marginTop: Spacing.sm },
  scrollContent: { paddingBottom: 100 },
  heroWrap: { width: "100%", height: HERO_HEIGHT },
  hero: { width: "100%", height: "100%" },
  heroFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm },
  titleText: { flex: 1 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginTop: 3,
  },
  metaLine: { marginTop: Spacing.xxs },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: Spacing.xxs },
  section: { marginTop: Spacing.lg },
  sectionTitle: { marginBottom: Spacing.sm },
  bio: { lineHeight: 21 },
  servicesList: { gap: Spacing.xs },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 },
  serviceInfo: { flex: 1, gap: 2 },
  serviceDescription: { marginTop: 1 },
  servicePrice: { marginTop: 2 },
  portfolioGrid: { flexDirection: "row", flexWrap: "wrap", gap: PORTFOLIO_GAP },
  portfolioTile: { width: PORTFOLIO_TILE, height: PORTFOLIO_TILE, borderRadius: Radius.sm },
  portfolioTileFallback: { alignItems: "center", justifyContent: "center" },
  footerSpacer: { height: Spacing.xl },
  ctaBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
