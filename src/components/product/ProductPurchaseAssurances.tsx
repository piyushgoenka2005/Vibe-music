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
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

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

const AUTO_SCROLL_MS = 3200;
const RESUME_AFTER_MS = 4500;
const MOBILE_MQ = "(max-width: 767px)";

function getStep(track: HTMLElement): number {
  const item = track.querySelector<HTMLElement>(".pdp-assurances__item");
  if (!item) return 180;
  const styles = getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  return item.offsetWidth + gap;
}

export default function ProductPurchaseAssurances() {
  const trackRef = useRef<HTMLUListElement>(null);
  const pausedUntilRef = useRef(0);
  const reduceMotion = usePrefersReducedMotion();
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollNext(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 4
    );
  }, []);

  const pauseAutoScroll = useCallback(() => {
    pausedUntilRef.current = Date.now() + RESUME_AFTER_MS;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateScrollState]);

  /* Mobile: auto-advance while keeping native swipe / drag scroll. */
  useEffect(() => {
    if (reduceMotion || !isMobile) return;

    const track = trackRef.current;
    if (!track) return;

    const onUserInteract = () => pauseAutoScroll();

    track.addEventListener("pointerdown", onUserInteract);
    track.addEventListener("touchstart", onUserInteract, { passive: true });
    track.addEventListener("wheel", onUserInteract, { passive: true });

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (Date.now() < pausedUntilRef.current) return;

      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 4) return;

      const step = getStep(track);
      const atEnd = track.scrollLeft >= maxScroll - 4;

      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: step, behavior: "smooth" });
      }
    }, AUTO_SCROLL_MS);

    return () => {
      window.clearInterval(timer);
      track.removeEventListener("pointerdown", onUserInteract);
      track.removeEventListener("touchstart", onUserInteract);
      track.removeEventListener("wheel", onUserInteract);
    };
  }, [isMobile, pauseAutoScroll, reduceMotion]);

  const enableAuto = isMobile && !reduceMotion;

  return (
    <aside className="pdp-assurances" aria-label="Purchase assurances">
      <div className="pdp-assurances__viewport">
        <ul
          ref={trackRef}
          className={[
            "pdp-assurances__list",
            enableAuto ? "pdp-assurances__list--auto" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onScroll={updateScrollState}
          aria-roledescription={enableAuto ? "carousel" : undefined}
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

        {canScrollNext && !enableAuto ? (
          <button
            type="button"
            className="pdp-assurances__nav"
            aria-label="Show more purchase assurances"
            onClick={() => {
              const track = trackRef.current;
              if (!track) return;
              track.scrollBy({
                left: getStep(track),
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
