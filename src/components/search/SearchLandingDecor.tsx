import { SEARCH_LANDING_DECOR_ITEMS } from "@/data/searchLandingDecor";

function EqualizerBars({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`sw-search-landing-decor__eq ${className}`.trim()}
      viewBox="0 0 48 64"
      aria-hidden="true"
    >
      {[12, 22, 32, 24, 40, 28, 18].map((height, index) => (
        <rect
          key={index}
          x={4 + index * 6}
          y={64 - height}
          width="3"
          height={height}
          rx="1.5"
          className="sw-search-landing-decor__eq-bar"
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </svg>
  );
}

function WaveRing({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`sw-search-landing-decor__wave ${className}`.trim()}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="52" className="sw-search-landing-decor__wave-ring" />
      <circle cx="60" cy="60" r="36" className="sw-search-landing-decor__wave-ring sw-search-landing-decor__wave-ring--inner" />
      <path
        d="M24 60c8-12 16-12 24 0s16 12 24 0"
        className="sw-search-landing-decor__wave-line"
      />
    </svg>
  );
}

export default function SearchLandingDecor() {
  return (
    <div className="sw-search-landing-decor" aria-hidden="true">
      <div className="sw-search-landing-decor__glow sw-search-landing-decor__glow--left" />
      <div className="sw-search-landing-decor__glow sw-search-landing-decor__glow--right" />

      <div className="sw-search-landing-decor__side sw-search-landing-decor__side--left">
        <EqualizerBars className="sw-search-landing-decor__eq--left" />
        {SEARCH_LANDING_DECOR_ITEMS.left.map((item) => (
          <div
            key={item.label}
            className="sw-search-landing-decor__card"
            style={{ animationDelay: item.delay }}
          >
            <img src={item.src} alt="" loading="lazy" decoding="async" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="sw-search-landing-decor__side sw-search-landing-decor__side--right">
        <WaveRing className="sw-search-landing-decor__wave--right" />
        {SEARCH_LANDING_DECOR_ITEMS.right.map((item) => (
          <div
            key={item.label}
            className="sw-search-landing-decor__card sw-search-landing-decor__card--alt"
            style={{ animationDelay: item.delay }}
          >
            <img src={item.src} alt="" loading="lazy" decoding="async" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
