import { Screen } from "@/components/ui/Screen";
import { ServicesSection } from "@/features/vendor/beauty/BeautySections";

/** BEAUTY-mode primary tab — see BeautySections.tsx's doc comment. `ServicesSection` renders its own "Services" heading. */
export default function VendorServicesTab() {
  return (
    <Screen>
      <ServicesSection />
    </Screen>
  );
}
