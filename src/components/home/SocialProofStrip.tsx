import { Star } from "lucide-react";
import { LANDING_SOCIAL_PROOF } from "@/data/landingStatus";
import Reveal from "@/components/layout/Reveal";

const PROOF_ITEMS = [
  { value: LANDING_SOCIAL_PROOF.rating, label: "Average rating", suffix: "/5" },
  { value: LANDING_SOCIAL_PROOF.reviewCount, label: "Verified reviews" },
  { value: LANDING_SOCIAL_PROOF.musicians, label: "Musicians served" },
  { value: LANDING_SOCIAL_PROOF.cities, label: "Cities delivered" },
  { value: LANDING_SOCIAL_PROOF.brands, label: "Authorized brands" },
] as const;

export default function SocialProofStrip() {
  return (
    <Reveal as="section" className="social-proof-strip" aria-label="Customer trust metrics">
      <div className="social-proof-strip__inner">
        <div className="social-proof-strip__rating">
          <Star size={18} className="social-proof-strip__star" aria-hidden />
          <span className="social-proof-strip__rating-value">
            {LANDING_SOCIAL_PROOF.rating}
            <span className="social-proof-strip__rating-suffix">/5</span>
          </span>
          <span className="social-proof-strip__rating-label">
            from {LANDING_SOCIAL_PROOF.reviewCount} reviews
          </span>
        </div>

        <ul className="social-proof-strip__metrics">
          {PROOF_ITEMS.slice(1).map((item) => (
            <li key={item.label} className="social-proof-strip__metric">
              <span className="social-proof-strip__metric-value">{item.value}</span>
              <span className="social-proof-strip__metric-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
