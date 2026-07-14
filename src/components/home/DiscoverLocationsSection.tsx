import type { CSSProperties } from "react";
import { MapPin } from "lucide-react";
import Marquee from "@/components/common/Marquee";
import { LANDING_LOCATIONS, type StatusTone } from "@/data/landingStatus";
import Reveal from "@/components/layout/Reveal";
import Link from "next/link";
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
      className="locations-strip__card locations-strip__card--solid"
      aria-hidden={ariaHidden || undefined}
      role="listitem"
      style={
        {
          "--location-accent": location.accent,
          background: `linear-gradient(145deg, ${location.accent} 0%, #0a1628 100%)`,
        } as CSSProperties
      }
    >
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
          <p className="locations-strip__eyebrow premium-section-eyebrow">
            Fulfillment
          </p>
          <h2 className="locations-strip__title">Where your gear ships from</h2>
          <p className="locations-strip__cities">
            Orders dispatch from our Maharashtra warehouse — we deliver
            pan-India with courier partners.
          </p>
        </header>

        <Marquee
          ariaLabel="Fulfillment and delivery coverage"
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

        <div className="locations-strip__footer">
          <MapPin size={16} aria-hidden />
          <Link href={ROUTES.contact}>Questions about delivery? Contact us</Link>
        </div>
      </div>
    </Reveal>
  );
}
