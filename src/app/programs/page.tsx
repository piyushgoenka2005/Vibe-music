import type { Metadata } from "next";
import Link from "next/link";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import ProgramsHubGrid from "@/components/programs/ProgramsHubGrid";
import { ROUTES } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/programs-hub.css";

export const metadata: Metadata = {
  title: "More ways to play",
  description:
    "Rentals, giveaways, used gear, gear exchange, studio services, and secure checkout — all from Vibe Music.",
};

export default function ProgramsHubPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <div className="storefront-page__inner programs-hub">
        <header className="storefront-page__header">
          <StorefrontBackButton />
          <p className="storefront-page__eyebrow">Programs</p>
          <h1 className="storefront-page__title">More ways to play</h1>
          <p className="storefront-page__subtitle">
            Beyond new gear — rent, win, trade, record, and pay your way with India&apos;s trusted
            music store.
          </p>
        </header>

        <ProgramsHubGrid />

        <p className="programs-hub__footer">
          Questions about any program? <Link href={ROUTES.contact}>Talk to a gear advisor</Link>
        </p>
      </div>
    </main>
  );
}
