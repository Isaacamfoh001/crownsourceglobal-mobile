import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Spacing } from "@/constants/theme";
import { VendorMoreButton } from "@/components/navigation/VendorMoreButton";
import { RequestsSection } from "@/features/vendor/beauty/BeautySections";

/** BEAUTY-mode primary tab — see BeautySections.tsx's doc comment. `RequestsSection` renders its own "Service requests" heading. */
export default function VendorRequestsTab() {
  return (
    <Screen>
      <View style={styles.topBar}>
        <VendorMoreButton />
      </View>
      <RequestsSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
});
