import type { Metadata } from "next";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { STUDIOS_RECORDING_CATEGORY } from "@/data/storefrontPrograms";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";

export const metadata: Metadata = {
  title: BRAND.studiosName,
  description:
    "Rehearsal rooms, recording sessions, and studio gear rentals from Vibe Music in Kolkata.",
};

export default function StudiosPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow="Programs"
        title={BRAND.studiosName}
        subtitle="Practice, record, and perform with studio-grade gear — book space and equipment through Vibe Music advisors."
        statusNote="Studio bookings and on-site sessions are arranged directly with our team. Tell us your date, duration, and instrumentation — we confirm availability and a quote."
        highlights={[
          "Rehearsal and small-session spaces in Kolkata",
          "Rent mics, interfaces, monitors, and backline from our rental catalog",
          "Engineer referrals for tracking and live sessions",
          "Combine studio time with gear purchases or rentals",
          "Corporate, school, and worship installs available on request",
        ]}
        actions={[
          {
            href: `${ROUTES.contact}?subject=${encodeURIComponent("Studio booking enquiry")}`,
            label: "Request studio booking",
            primary: true,
          },
          {
            href: ROUTES.rentals,
            label: "Rent studio gear",
          },
          {
            href: STUDIOS_RECORDING_CATEGORY,
            label: "Shop recording gear",
          },
        ]}
      />
    </main>
  );
}
