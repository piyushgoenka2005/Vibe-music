import type { Metadata } from "next";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import TrackingPageContent from "@/components/tracking/TrackingPageContent";
import { pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("Track Order"),
};

export default function TrackingPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <TrackingPageContent />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
