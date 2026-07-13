import type { Metadata } from "next";
import { Suspense } from "react";
import TrackingPageContent from "@/components/tracking/TrackingPageContent";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Track Order | ${BRAND.name}`,
  description: "Track your Vibe Music order from dispatch to delivery.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<p className="storefront-loading">Loading...</p>}>
      <TrackingPageContent />
    </Suspense>
  );
}
