import { LANDING_LIVE_TICKER } from "@/data/landingStatus";

interface LandingLiveTickerProps {
  className?: string;
  variant?: "announcement" | "hero-bridge";
}

export default function LandingLiveTicker({
  className,
  variant = "announcement",
}: LandingLiveTickerProps) {
  const items = [...LANDING_LIVE_TICKER, ...LANDING_LIVE_TICKER];

  return (
    <div
      className={["landing-live-ticker", `landing-live-ticker--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="landing-live-ticker__inner">
        <div className="landing-live-ticker__viewport">
          <ul className="landing-live-ticker__track">
            {items.map((message, index) => (
              <li key={`${message}-${index}`} className="landing-live-ticker__item">
                <span className="landing-live-ticker__dot" aria-hidden />
                {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
