"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  ChevronRight,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

interface AssuranceItem {
  icon: LucideIcon;
  label: string;
  detail: string;
}

const ASSURANCES: AssuranceItem[] = [
  {
    icon: Truck,
    label: "Free Shipping",
    detail: "Free delivery on orders over ₹9,999",
  },
  {
    icon: CreditCard,
    label: "Secure Online Pay",
    detail: "Pay securely online — UPI, cards & wallets",
  },
  {
    icon: RotateCcw,
    label: "Easy Returns",
    detail: "7-day easy returns on eligible gear",
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

const ASSURANCE_SCROLL = 180;

export default function ProductPurchaseAssurances() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollNext(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 4
    );
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateScrollState]);

  return (
    <aside className="pdp-assurances" aria-label="Purchase assurances">
      <div className="pdp-assurances__viewport">
        <ul
          ref={trackRef}
          className="pdp-assurances__list"
          onScroll={updateScrollState}
        >
          {ASSURANCES.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="pdp-assurances__item">
                <span className="pdp-assurances__icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="pdp-assurances__label">{item.label}</span>
                <span className="pdp-assurances__detail">{item.detail}</span>
              </li>
            );
          })}
        </ul>

        {canScrollNext ? (
          <button
            type="button"
            className="pdp-assurances__nav"
            aria-label="Show more purchase assurances"
            onClick={() => {
              trackRef.current?.scrollBy({
                left: ASSURANCE_SCROLL,
                behavior: "smooth",
              });
            }}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
