"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

interface TrustBadge {
  icon: LucideIcon;
  label: string;
  detail: string;
}

const TRUST_BADGES: TrustBadge[] = [
  {
    icon: Truck,
    label: "Free Shipping",
    detail: "Free delivery on orders over ₹2,999",
  },
  {
    icon: CreditCard,
    label: "Secure Online Pay",
    detail: "Pay securely online — UPI, cards & wallets",
  },
  {
    icon: RotateCcw,
    label: "Easy Returns",
    detail: "10-day easy returns on eligible gear",
  },
  {
    icon: ShieldCheck,
    label: "Manufacturer Warranty",
    detail: "Official warranty on all new products",
  },
  {
    icon: Award,
    label: "Authorized Dealer",
    detail: "100% genuine gear from authorized brands",
  },
];

export default function ProductTrustBadges() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showArrows, setShowArrows] = useState(false);

  const updateScrollState = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const maxScroll = strip.scrollWidth - strip.clientWidth;
    const hasOverflow = maxScroll > 4;
    setShowArrows(hasOverflow);
    setCanScrollLeft(strip.scrollLeft > 4);
    setCanScrollRight(strip.scrollLeft < maxScroll - 4);
  }, []);

  const scrollStrip = useCallback((direction: "left" | "right") => {
    const strip = stripRef.current;
    if (!strip) return;

    const badge = strip.querySelector<HTMLElement>(".pdp-trust-badge");
    const step = badge ? badge.offsetWidth + 12 : 100;
    strip.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    const strip = stripRef.current;
    if (!strip) return;

    strip.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      strip.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  return (
    <div className="pdp-trust" aria-label="Purchase assurances">
      <div className="pdp-trust__outer">
        {showArrows ? (
          <button
            type="button"
            className="pdp-trust__arrow pdp-trust__arrow--left"
            onClick={() => scrollStrip("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll assurances left"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        ) : null}

        <div ref={stripRef} className="pdp-trust__strip" role="list">
          {TRUST_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.label} className="pdp-trust-badge" role="listitem">
                <span className="pdp-trust-badge__icon-wrap" aria-hidden="true">
                  <Icon size={20} className="pdp-trust-badge__icon" strokeWidth={1.75} />
                </span>
                <span className="pdp-trust-badge__label">{badge.label}</span>
                <span className="pdp-trust-badge__detail">{badge.detail}</span>
              </div>
            );
          })}
        </div>

        {showArrows ? (
          <button
            type="button"
            className="pdp-trust__arrow pdp-trust__arrow--right"
            onClick={() => scrollStrip("right")}
            disabled={!canScrollRight}
            aria-label="Scroll assurances right"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
