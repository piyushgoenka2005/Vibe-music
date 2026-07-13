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

const RENTAL_ENQUIRY_SUBJECT = "Instrument rental enquiry";
const RENTAL_ENQUIRY_BODY = [
  "Hi Vibe Music,",
  "",
  "I'd like a rental quote.",
  "",
  "Gear needed:",
  "Dates / duration:",
  "City / delivery area:",
  "Event or use case:",
  "",
  "Thanks,",
].join("\n");

export default function RentalsPage() {
  const contactHref = `${ROUTES.contact}?subject=${encodeURIComponent(RENTAL_ENQUIRY_SUBJECT)}&body=${encodeURIComponent(RENTAL_ENQUIRY_BODY)}`;

  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow="Programs"
        title="Instrument rentals"
        subtitle="Need a keyboard, PA, or guitar for a short run? We can help you plan a rental when gear is available."
        statusNote="Online self-serve rentals and a rental cart are not live yet. Availability is confirmed by our team — use the enquiry form template below (gear, dates, city)."
        highlights={[
          "Short-term rentals for practice, sessions, and events",
          "Tell us gear, dates/duration, and delivery city in your enquiry",
          "Delivery options and deposits are confirmed case by case",
          "Security deposit and ID may be required",
          "We will not invent fake “rental” catalog results in search",
        ]}
        actions={[
          {
            href: contactHref,
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
