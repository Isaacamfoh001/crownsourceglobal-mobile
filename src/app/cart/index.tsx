import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatMoney } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/features/cart/useCart";
import { useUpdateCartItemQuantity, useRemoveCartItem } from "@/features/cart/useCartMutations";
import { promptSignInRequired } from "@/lib/auth/requireAuthPrompt";
import type { CartLineDTO } from "@/types/api";

/**
 * Native Cart (M25) — vendor-grouped, matching the backend's own
 * multi-vendor cart/checkout/fulfilment architecture (CLAUDE.md §9): a
 * flat single-vendor list would misrepresent how the order actually splits
 * into per-vendor Fulfilments. Every quantity/remove action calls the real
 * `/api/v1/cart/items` endpoints directly — there is no local-only cart
 * state to keep in sync.
 */
export default function CartScreen() {
  const { colors } = useAppTheme();
  const { status: authStatus } = useAuth();
  const cartQuery = useCart(authStatus === "SIGNED_IN");

  const cart = cartQuery.data;
  const isEmpty = authStatus === "SIGNED_IN" && cart && cart.vendorGroups.length === 0;

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text variant="sectionHeading" tone="primary">
          Cart
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {authStatus === "SIGNED_OUT" && (
        <EmptyState
          icon="bag-handle-outline"
          title="Sign in to view your cart"
          message="Your cart is saved to your account so it's there whenever you come back."
          actionLabel="Sign In"
          onAction={() => promptSignInRequired("view your cart", "/cart")}
        />
      )}

      {authStatus === "SIGNED_IN" && cartQuery.isPending && (
        <View style={styles.loadingBlock}>
          <Skeleton height={90} radius={Radius.lg} />
          <Skeleton height={90} radius={Radius.lg} style={styles.gap} />
        </View>
      )}

      {authStatus === "SIGNED_IN" && cartQuery.isError && (
        <ErrorState title="Couldn't load your cart" message={friendlyErrorMessage(cartQuery.error)} onRetry={() => cartQuery.refetch()} />
      )}

      {isEmpty && (
        <EmptyState
          icon="bag-handle-outline"
          title="Your cart is empty"
          message="Browse the shop to find something you'll love."
          actionLabel="Browse Shop"
          onAction={() => router.push("/(tabs)/shop")}
        />
      )}

      {cart && cart.vendorGroups.length > 0 && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {cart.vendorGroups.map((group) => (
              <View key={group.vendor.id} style={styles.vendorGroup}>
                <View style={styles.vendorHeader}>
                  <Text variant="small" tone="muted" style={styles.vendorName}>
                    {group.vendor.companyName.toUpperCase()}
                  </Text>
                  <Text variant="small" tone="muted">
                    {formatMoney(group.subtotal)}
                  </Text>
                </View>
                {group.lines.map((line) => (
                  <CartLineRow key={line.id} line={line} />
                ))}
              </View>
            ))}
          </ScrollView>

          <SafeAreaView edges={["bottom"]} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.totalRow}>
              <Text variant="body" tone="secondary">
                Subtotal ({cart.itemCount} item{cart.itemCount === 1 ? "" : "s"})
              </Text>
              <Text variant="cardTitle" tone="primary">
                {formatMoney(cart.subtotal)}
              </Text>
            </View>
            <Text variant="small" tone="muted" style={styles.footerHint}>
              Delivery and final totals are confirmed at checkout.
            </Text>
            <Button label="Checkout" onPress={() => router.push("/checkout")} fullWidth style={styles.checkoutButton} />
          </SafeAreaView>
        </>
      )}
    </SafeAreaView>
  );
}

function CartLineRow({ line }: { line: CartLineDTO }) {
  const { colors } = useAppTheme();
  const updateQuantity = useUpdateCartItemQuantity();
  const removeItem = useRemoveCartItem();
  const isBusy = updateQuantity.isPending || removeItem.isPending;
  const isUnavailable = line.availabilityStatus === "OUT_OF_STOCK" || line.availableQuantity < line.moq;

  const maxQuantity = Math.min(line.maxOq ?? line.availableQuantity, line.availableQuantity);

  return (
    <View style={styles.line}>
      <View style={[styles.lineImageWrap, { backgroundColor: colors.surfaceSubtle }]}>
        <FallbackImage
          uri={line.primaryImage}
          style={styles.lineImage}
          contentFit="cover"
          fallback={<Ionicons name="image-outline" size={20} color={colors.textMuted} />}
        />
      </View>

      <View style={styles.lineBody}>
        <Text variant="body" tone="primary" numberOfLines={2}>
          {line.title}
        </Text>
        {isUnavailable ? (
          <Text variant="small" tone="error" style={styles.lineMeta}>
            No longer available in this quantity
          </Text>
        ) : (
          <Text variant="small" tone="muted" style={styles.lineMeta}>
            {formatMoney(line.unitPrice)} / unit{line.hasBulkPricing ? " · bulk pricing applied" : ""}
          </Text>
        )}

        <View style={styles.lineFooter}>
          <QuantityStepper
            quantity={line.quantity}
            min={line.moq}
            max={maxQuantity}
            compact
            onChange={(quantity) => updateQuantity.mutate({ cartItemId: line.id, quantity })}
          />
          <Text variant="bodyMedium" tone="primary">
            {formatMoney(line.lineTotal)}
          </Text>
        </View>
        {updateQuantity.isError && (
          <Text variant="small" tone="error" style={styles.lineMeta}>
            {friendlyErrorMessage(updateQuantity.error)}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => removeItem.mutate(line.id)}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${line.title} from cart`}
        hitSlop={8}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerSpacer: { width: TouchTarget },
  loadingBlock: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  gap: { marginTop: Spacing.sm },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  vendorGroup: { marginTop: Spacing.lg },
  vendorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.xs },
  vendorName: { letterSpacing: 0.4 },
  line: { flexDirection: "row", gap: Spacing.sm, paddingVertical: Spacing.sm },
  lineImageWrap: { width: 64, height: 64, borderRadius: Radius.md, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  lineImage: { width: 64, height: 64 },
  lineBody: { flex: 1, gap: 2 },
  lineMeta: { marginTop: 1 },
  lineFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.xs },
  removeButton: { padding: Spacing.xxs },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerHint: { marginTop: 2 },
  checkoutButton: { marginTop: Spacing.sm },
});
