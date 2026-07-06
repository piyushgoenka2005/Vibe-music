import Link from "next/link";
import Marquee from "@/components/common/Marquee";
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
      </div>
      <p className="locations-strip__city">{location.city}</p>
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

        <Marquee
          ariaLabel="Store locations"
          className="locations-strip__marquee"
          duration="42s"
          role="list"
          sequenceClassName="locations-strip__sequence"
          trackClassName="locations-strip__marquee-track"
        >
          {LANDING_LOCATIONS.map((location) => (
            <LocationCard key={location.city} location={location} />
          ))}
        </Marquee>

        <Link href={ROUTES.search} className="locations-strip__cta premium-btn premium-btn--outline">
          Find a location
        </Link>
      </div>
    </Reveal>
  );
}
