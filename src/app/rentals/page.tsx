import type { Metadata } from "next";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import { ROUTES, categoryPath } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";

export const metadata: Metadata = {
  title: "Instrument Rentals",
  description:
    "Ask Vibe Music about short-term instrument and pro audio rentals for practice, gigs, and studios.",
};

export default function RentalsPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow="Programs"
        title="Instrument rentals"
        subtitle="Need a keyboard, PA, or guitar for a short run? We can help you plan a rental when gear is available."
        statusNote="Online self-serve rentals are not live yet. Availability is confirmed by our team — tell us what you need, for how long, and where."
        highlights={[
          "Short-term rentals for practice, sessions, and events",
          "Delivery options discussed case by case",
          "Security deposit and ID may be required",
          "We will not invent fake “rental” catalog results in search",
        ]}
        actions={[
          {
            href: `${ROUTES.contact}?subject=${encodeURIComponent("Instrument rental enquiry")}`,
            label: "Request a rental quote",
            primary: true,
          },
          {
            href: categoryPath("keyboards-synthesizers"),
            label: "Browse keyboards",
          },
          {
            href: categoryPath("live-sound-lighting"),
            label: "Browse live sound",
          },
          {
            href: ROUTES.search,
            label: "Search to buy instead",
          },
        ]}
      />
    </main>
  );
}
