import type { Metadata } from "next";
import Link from "next/link";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { STOREFRONT_PROGRAMS } from "@/data/storefrontPrograms";
import { ROUTES } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/programs-hub.css";

export const metadata: Metadata = {
  title: "Programs & Services",
  description:
    "Rentals, giveaways, used gear, gear exchange, studio services, and secure checkout — all from Vibe Music.",
};

export default function ProgramsHubPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <div className="storefront-page__inner programs-hub">
        <header className="storefront-page__header">
          <StorefrontBackButton />
          <p className="storefront-page__eyebrow">Vibe Music</p>
          <h1 className="storefront-page__title">Programs &amp; services</h1>
          <p className="storefront-page__subtitle">
            Beyond new gear — rent, win, trade, record, and pay your way with India&apos;s trusted
            music store.
          </p>
        </header>

        <div className="programs-hub__grid" role="list">
          {STOREFRONT_PROGRAMS.map((program) => (
            <article key={program.id} className="programs-hub__card" role="listitem">
              <h2 className="programs-hub__card-title">{program.title}</h2>
              <p className="programs-hub__card-copy">{program.description}</p>
              <Link href={program.href} className="programs-hub__card-link">
                {program.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="programs-hub__footer">
          Questions about any program? <Link href={ROUTES.contact}>Talk to a gear advisor</Link>
        </p>
      </div>
    </main>
  );
}
