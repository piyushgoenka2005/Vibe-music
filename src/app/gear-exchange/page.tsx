import type { Metadata } from "next";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import { BRAND } from "@/lib/brand";
import { ROUTES, categoryPath } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";

export const metadata: Metadata = {
  title: BRAND.gearExchangeName,
  description:
    "Trade in or consign musical instruments and pro audio with Vibe Music gear advisors in Kolkata.",
};

export default function GearExchangePage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow="Programs"
        title={BRAND.gearExchangeName}
        subtitle="Turn your trusted gear into store credit or cash — inspected, fairly valued, and handled by musicians who understand condition."
        statusNote="We accept trade-ins and consignments by appointment. Share photos, serial numbers, and your target timeline — our team replies within one business day."
        highlights={[
          "Guitars, basses, keyboards, drums, mics, and pro audio welcome",
          "Transparent condition grading before we quote",
          "Store credit toward new or used gear on vibemusic.in",
          "Secure packing guidance if you ship gear to Kolkata",
          "Local pickup available in the Kolkata metro area",
        ]}
        actions={[
          {
            href: `${ROUTES.contact}?subject=${encodeURIComponent("Gear Exchange trade-in enquiry")}`,
            label: "Start a trade-in enquiry",
            primary: true,
          },
          {
            href: ROUTES.used,
            label: "Browse used & open-box",
          },
          {
            href: categoryPath("guitars"),
            label: "Shop new guitars",
          },
        ]}
      />
    </main>
  );
}
