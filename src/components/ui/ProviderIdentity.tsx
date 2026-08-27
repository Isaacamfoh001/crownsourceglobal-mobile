import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "./Text";

type ProviderIdentityProps = {
  name: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
  size?: number;
  /** Use on a dark/photo-backed surface (e.g. an Explore post header) regardless of app theme. */
  onDarkSurface?: boolean;
};

/** Compact avatar + name row for a business/provider identity — used on Explore post cards; small enough to survive a long business name without pushing card layout around. */
export function ProviderIdentity({ name, avatarUrl, subtitle, size = 22, onDarkSurface = false }: ProviderIdentityProps) {
  const { colors } = useAppTheme();
  const nameTone = onDarkSurface ? "inverse" : "primary";
  const subtitleTone = onDarkSurface ? "inverse" : "secondary";

  return (
    <View style={styles.row}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceSubtle }]} contentFit="cover" />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarFallback,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: onDarkSurface ? "rgba(255,255,255,0.24)" : colors.surfaceSubtle },
          ]}
        >
          <Text variant="caption" tone={onDarkSurface ? "inverse" : "secondary"}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.textCol}>
        <Text variant="smallMedium" tone={nameTone} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? (
          <Text variant="small" tone={subtitleTone} numberOfLines={1} style={onDarkSurface && styles.subtitleOnDark}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  avatar: {},
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  textCol: { flex: 1 },
  subtitleOnDark: { opacity: 0.8 },
});
