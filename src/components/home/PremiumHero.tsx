import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import PremiumHeroRotatingVisual from "@/components/home/PremiumHeroRotatingVisual";

export default function PremiumHero() {
  return (
    <section className="premium-hero premium-hero--split">
      <div className="premium-hero__inner">
        <div className="premium-hero__copy">
          <h2 className="premium-hero__title">
            Sound better
            <br />
            <span className="premium-hero__title-accent">Play louder</span>
            <br />
            Ship faster.
          </h2>
          <p className="premium-hero__subtitle">
            Musical instruments, pro audio, and studio essentials — curated for
            creators who want gear that keeps up.
          </p>
          <div className="premium-hero__actions">
            <Link
              href={ROUTES.search}
              className="premium-btn premium-btn--primary premium-btn--lg"
            >
              Shop all gear
            </Link>
            <Link
              href={`${ROUTES.searchResults}?q=deals`}
              className="premium-btn premium-btn--outline premium-btn--lg"
            >
              View deals
            </Link>
          </div>
        </div>
        <div className="premium-hero__visual">
          <div className="premium-hero__card">
            <div className="premium-hero__mesh" aria-hidden />
            <div className="premium-hero__orb" aria-hidden />
            <span
              className="premium-hero__badge premium-hero__badge--top premium-hero__badge--trending"
              aria-hidden
            >
              New arrivals weekly
            </span>
            <PremiumHeroRotatingVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
