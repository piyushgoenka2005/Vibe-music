import Link from "next/link";
import { MARKETING_HERO_IMAGE } from "@/lib/categoryImages";
import { ROUTES } from "@/lib/routes";
import type { HomepageBanner } from "@/types/banner";
import HomepageBannerCarousel from "@/components/sections/HomepageBanner/HomepageBannerCarousel";
import Reveal from "@/components/layout/Reveal";

interface PremiumHeroProps {
  banners: HomepageBanner[];
}

export default function PremiumHero({ banners }: PremiumHeroProps) {
  if (banners.length > 0) {
    return (
      <Reveal as="section" className="premium-hero premium-hero--carousel">
        <HomepageBannerCarousel banners={banners} />
      </Reveal>
    );
  }

  return (
    <Reveal as="section" className="premium-hero premium-hero--split">
      <div className="premium-hero__inner">
        <div className="premium-hero__copy">
          <p className="premium-hero__eyebrow">
            <span className="premium-hero__eyebrow-dot" aria-hidden />
            India&apos;s gear destination
          </p>
          <h2 className="premium-hero__title">
            Sound better.
            <br />
            <span className="premium-hero__title-accent">Play louder.</span>
            <br />
            Ship faster.
          </h2>
          <p className="premium-hero__subtitle">
            Musical instruments, pro audio, and studio essentials — curated for
            creators who want gear that keeps up.
          </p>
          <div className="premium-hero__actions">
            <Link href={ROUTES.search} className="premium-btn premium-btn--primary premium-btn--lg">
              Shop all gear
            </Link>
            <Link
              href={`${ROUTES.searchResults}?q=deals`}
              className="premium-btn premium-btn--outline premium-btn--lg"
            >
              View deals
            </Link>
          </div>
          <ul className="premium-hero__tags" aria-label="Highlights">
            <li>Free shipping over ₹2,999</li>
            <li>Easy returns</li>
            <li>Expert support</li>
          </ul>
        </div>
        <div className="premium-hero__visual">
          <div className="premium-hero__mesh" aria-hidden />
          <div className="premium-hero__orb" aria-hidden />
          <div className="premium-hero__badge premium-hero__badge--top" aria-hidden>
            New arrivals weekly
          </div>
          <img
            src={MARKETING_HERO_IMAGE}
            alt="Musician with professional gear"
            className="premium-hero__image"
            loading="eager"
          />
        </div>
      </div>
    </Reveal>
  );
}
