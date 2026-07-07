import Link from "next/link";
import { MapPin } from "lucide-react";
import Marquee from "@/components/common/Marquee";
import { LANDING_LOCATIONS, type StatusTone } from "@/data/landingStatus";
import Reveal from "@/components/layout/Reveal";
import { ROUTES } from "@/lib/routes";

function LocationStatusTag({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  return (
    <span className={`location-status-tag location-status-tag--${tone}`}>
      {tone === "live" ? <span className="location-status-tag__dot" aria-hidden /> : null}
      <span className="location-status-tag__label">{label}</span>
    </span>
  );
}

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
        <LocationStatusTag label={location.status} tone={location.tone} />
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
          <MapPin className="locations-strip__cta-icon" size={16} strokeWidth={2.25} aria-hidden />
          Find a location
        </Link>
      </div>
    </Reveal>
  );
}
