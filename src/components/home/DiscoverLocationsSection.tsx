import Link from "next/link";
import { LANDING_LOCATIONS } from "@/data/landingStatus";
import StatusChip from "@/components/home/StatusChip";
import Reveal from "@/components/layout/Reveal";
import { ROUTES } from "@/lib/routes";

function LocationCard({
  location,
  ariaHidden = false,
}: {
  location: (typeof LANDING_LOCATIONS)[number];
  ariaHidden?: boolean;
}) {
  return (
    <article
      className="locations-strip__card"
      aria-hidden={ariaHidden || undefined}
      role="listitem"
    >
      <img
        src={location.image}
        alt={ariaHidden ? "" : `${location.city} location`}
        className="locations-strip__image"
        loading="lazy"
      />
      <div className="locations-strip__overlay" />
      <div className="locations-strip__meta">
        <StatusChip
          label={location.status}
          tone={location.tone}
          showDot={location.tone === "live"}
          className="locations-strip__status"
        />
        <p className="locations-strip__city">{location.city}</p>
      </div>
    </article>
  );
}

export default function DiscoverLocationsSection() {
  return (
    <Reveal as="section" className="locations-strip">
      <div className="locations-strip__inner">
        <header className="locations-strip__header">
          <p className="locations-strip__eyebrow premium-section-eyebrow">Store network</p>
          <h2 className="locations-strip__title">Discover our locations</h2>
          <p className="locations-strip__cities">
            Delhi · Kolkata · Nagpur · North East · Mumbai
          </p>
        </header>

        <div
          className="locations-strip__marquee"
          role="region"
          aria-label="Store locations"
        >
          <div className="locations-strip__marquee-track">
            <div className="locations-strip__sequence" role="list">
              {LANDING_LOCATIONS.map((location) => (
                <LocationCard key={location.city} location={location} />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="locations-strip__sequence locations-strip__sequence--clone"
            >
              {LANDING_LOCATIONS.map((location) => (
                <LocationCard
                  key={`${location.city}-clone`}
                  ariaHidden
                  location={location}
                />
              ))}
            </div>
          </div>
        </div>

        <Link href={ROUTES.search} className="locations-strip__cta premium-btn premium-btn--outline">
          Find a location
        </Link>
      </div>
    </Reveal>
  );
}
