import { Suspense } from "react";
import TrackingPageContent from "@/components/tracking/TrackingPageContent";

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<p className="storefront-loading">Loading...</p>}>
      <TrackingPageContent />
    </Suspense>
  );
}
