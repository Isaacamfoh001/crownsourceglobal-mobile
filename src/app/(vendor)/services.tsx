import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Spacing } from "@/constants/theme";
import { VendorMoreButton } from "@/components/navigation/VendorMoreButton";
import { ServicesSection } from "@/features/vendor/beauty/BeautySections";

/** BEAUTY-mode primary tab — see BeautySections.tsx's doc comment. `ServicesSection` renders its own "Services" heading. */
export default function VendorServicesTab() {
  return (
    <Screen>
      <View style={styles.topBar}>
        <VendorMoreButton />
      </View>
      <ServicesSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
});
