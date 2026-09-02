import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./Text";
import { Radius, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

/**
 * Generic searchable single-select list, presented as a full-screen modal
 * (M24) — used by Source's country picker and the quote-acceptance
 * delivery form's region picker rather than forcing free-typed values into
 * fields the backend validates against a fixed list (deliveryCountry,
 * DeliveryInfo.region). Not a combobox/dropdown library — this is a small
 * enough pattern to own directly (mirrors the web CountrySelect's own
 * "no dropdown dependency" choice).
 */
export function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  searchable = true,
}: {
  visible: boolean;
  title: string;
  options: readonly string[];
  selected: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchable?: boolean;
}) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top", "bottom"]} style={[styles.flex, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <Text variant="sectionHeading" tone="primary">
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {searchable ? (
          <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : null}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  setQuery("");
                  onClose();
                }}
                style={[styles.row, isSelected && { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
              >
                <Text variant="body" tone={isSelected ? "pink" : "primary"}>
                  {item}
                </Text>
                {isSelected ? <Ionicons name="checkmark" size={18} color={colors.pink} /> : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text variant="small" tone="muted" style={styles.emptyText}>
              No matches
            </Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15 },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  emptyText: { textAlign: "center", marginTop: Spacing.xl },
});
