import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import PremiumHeroRotatingVisual from "@/components/home/PremiumHeroRotatingVisual";
import type { MarketingHeroSlide } from "@/data/marketingHeroSlides";

interface PremiumHeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  slides?: MarketingHeroSlide[];
}

export default function PremiumHero({
  title = "Sound better\nPlay louder\nShip faster.",
  subtitle = "Musical instruments, pro audio, and studio essentials — curated for creators who want gear that keeps up.",
  ctaText = "Shop all gear",
  ctaLink = ROUTES.search,
  secondaryCtaText = "View deals",
  secondaryCtaLink = `${ROUTES.searchResults}?q=deals`,
  slides,
}: PremiumHeroProps) {
  const titleLines = title.split("\n");
  return (
    <section className="premium-hero premium-hero--split">
      <div className="premium-hero__inner">
        <div className="premium-hero__copy">
          <h2 className="premium-hero__title">
            {titleLines.map((line, index) => (
              <span
                key={`${line}-${index}`}
                className={index === 1 ? "premium-hero__title-accent" : undefined}
              >
                {line}
                {index < titleLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h2>
          <p className="premium-hero__subtitle">{subtitle}</p>
          <div className="premium-hero__actions">
            <Link href={ctaLink} className="premium-btn premium-btn--primary premium-btn--lg">
              {ctaText}
            </Link>
            <Link
              href={secondaryCtaLink}
              className="premium-btn premium-btn--outline premium-btn--lg"
            >
              {secondaryCtaText}
            </Link>
          </div>
        </div>
        <div className="premium-hero__visual">
          <div className="premium-hero__card premium-hero__card--mosaic">
            <div className="premium-hero__mesh" aria-hidden />
            <div className="premium-hero__orb" aria-hidden />
            <PremiumHeroRotatingVisual slides={slides} />
          </div>
        </div>
      </div>
    </section>
  );
}
