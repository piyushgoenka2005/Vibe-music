"use client";

import { Star, ArrowUp } from "lucide-react";
import { LANDING_SOCIAL_PROOF } from "@/data/landingStatus";

const PROOF_ITEMS = [
  { value: LANDING_SOCIAL_PROOF.musicians, label: "Delivery reach" },
  { value: LANDING_SOCIAL_PROOF.cities, label: "Shipping coverage" },
  { value: LANDING_SOCIAL_PROOF.brands, label: "Brand partners" },
] as const;

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function SocialProofStrip() {
  return (
    <section className="social-proof-strip" aria-label="Customer trust metrics">
      <div className="social-proof-strip__inner">
        <div className="social-proof-strip__rating">
          <Star
            className="social-proof-strip__star"
            size={22}
            strokeWidth={2}
            aria-hidden
          />
          <p className="social-proof-strip__rating-score">
            <span className="social-proof-strip__rating-value">
              {LANDING_SOCIAL_PROOF.rating}
            </span>
            <span className="social-proof-strip__rating-suffix">
              / {LANDING_SOCIAL_PROOF.ratingScale}
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

        <button
          type="button"
          className="social-proof-strip__top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ArrowUp size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </section>
  );
}
