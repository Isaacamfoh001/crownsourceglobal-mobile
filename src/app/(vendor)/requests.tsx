import { Screen } from "@/components/ui/Screen";
import { RequestsSection } from "@/features/vendor/beauty/BeautySections";

/** BEAUTY-mode primary tab — see BeautySections.tsx's doc comment. `RequestsSection` renders its own "Service requests" heading. */
export default function VendorRequestsTab() {
  return (
    <Screen>
      <RequestsSection />
    </Screen>
  );
}
