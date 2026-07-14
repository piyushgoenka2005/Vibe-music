import { LANDING_SOCIAL_PROOF } from "@/data/landingStatus";

const PROOF_ITEMS = [
  { value: LANDING_SOCIAL_PROOF.musicians, label: "Delivery reach" },
  { value: LANDING_SOCIAL_PROOF.cities, label: "Shipping coverage" },
  { value: LANDING_SOCIAL_PROOF.brands, label: "Brand partners" },
] as const;

function BlueStarIcon() {
  return (
    <svg
      className="social-proof-strip__star"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2.5l2.83 5.73 6.33.92-4.58 4.46 1.08 6.3L12 16.98 6.34 19.91l1.08-6.3L2.84 9.15l6.33-.92L12 2.5z"
        stroke="#1253ed"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function SocialProofStrip() {
  return (
    <section className="social-proof-strip" aria-label="Customer trust metrics">
      <div className="social-proof-strip__inner">
        <div className="social-proof-strip__rating">
          <BlueStarIcon />
          <p className="social-proof-strip__rating-score">
            <span className="social-proof-strip__rating-value">
              {LANDING_SOCIAL_PROOF.rating}
            </span>
            <span className="social-proof-strip__rating-suffix">
              /{LANDING_SOCIAL_PROOF.ratingScale}
            </span>
          </p>
          <span className="social-proof-strip__rating-label">
            {LANDING_SOCIAL_PROOF.detail}
          </span>
        </div>

        <ul className="social-proof-strip__metrics">
          {PROOF_ITEMS.map((item) => (
            <li key={item.label} className="social-proof-strip__metric">
              <span className="social-proof-strip__metric-value">{item.value}</span>
              <span className="social-proof-strip__metric-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
