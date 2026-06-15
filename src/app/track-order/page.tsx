import { Suspense } from "react";
import HtmlSection from "@/components/vibe/HtmlSection";
import TrackingPageContent from "@/components/tracking/TrackingPageContent";

export default function TrackOrderPage() {
  return (
    <>
      <HtmlSection file="header" />
      <Suspense fallback={<p style={{ padding: 24 }}>Loading...</p>}>
        <TrackingPageContent />
      </Suspense>
      <HtmlSection file="footer" />
    </>
  );
}
