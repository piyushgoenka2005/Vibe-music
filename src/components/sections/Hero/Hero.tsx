"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type MouseEvent,
} from "react";
import { HERO_SLIDES } from "@/data/heroSlides";
import { resolveLinkHref } from "@/lib/routes";
import HeroControls from "./HeroControls";
import HeroSlide, { type HeroSlideSlot } from "./HeroSlide";
import "./hero.css";

function emptySlot(): HeroSlideSlot {
  return { src: "", alt: "" };
}

function advanceIndex(
  indices: number[],
  currentIdx: number,
  otherVisibleSrc: string,
  pool: string[]
): number {
  let next = (currentIdx + 1) % indices.length;
  while (
    pool[indices[next]!] === otherVisibleSrc &&
    indices.length > 1
  ) {
    next = (next + 1) % indices.length;
    if (next === currentIdx) break;
  }
  return next;
}

/** Homepage Drum Month triptych superhero. */
export default function Hero() {
  const {
    testId,
    heroClassName,
    intervalMs,
    mobileMediaQuery,
    overlayId,
    triptych,
    mainHref,
    mainHpSection,
    mainHpSlot,
    eyebrow,
    headline,
    subhead,
    cta,
    stripe,
  } = HERO_SLIDES;

  const { pool, leftIndices, rightIndices, initialRightIndex } = triptych;

  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const lockupSrc = headline.src;

  const [leftActiveSlot, setLeftActiveSlot] = useState<0 | 1>(0);
  const [rightActiveSlot, setRightActiveSlot] = useState<0 | 1>(0);
  const [mobileActiveSlot, setMobileActiveSlot] = useState<0 | 1>(0);

  const [leftSlots, setLeftSlots] = useState<[HeroSlideSlot, HeroSlideSlot]>(
    () => [
      { src: pool[leftIndices[0]!]!, alt: "Slide 1" },
      emptySlot(),
    ]
  );
  const [rightSlots, setRightSlots] = useState<[HeroSlideSlot, HeroSlideSlot]>(
    () => [
      {
        src: pool[rightIndices[initialRightIndex % rightIndices.length]!]!,
        alt: "Slide 1",
      },
      emptySlot(),
    ]
  );
  const [mobileSlots, setMobileSlots] = useState<
    [HeroSlideSlot, HeroSlideSlot]
  >(() => [{ src: pool[0]!, alt: "Slide 1" }, emptySlot()]);

  const leftIndexRef = useRef(0);
  const rightIndexRef = useRef(initialRightIndex % rightIndices.length);
  const mobileIndexRef = useRef(0);

  const leftActiveSlotRef = useRef<0 | 1>(0);
  const rightActiveSlotRef = useRef<0 | 1>(0);
  const mobileActiveSlotRef = useRef<0 | 1>(0);

  const leftSlotsRef = useRef(leftSlots);
  const rightSlotsRef = useRef(rightSlots);
  const mobileSlotsRef = useRef(mobileSlots);

  const leftPendingRef = useRef<0 | 1 | null>(null);
  const rightPendingRef = useRef<0 | 1 | null>(null);
  const mobilePendingRef = useRef<0 | 1 | null>(null);

  useEffect(() => {
    leftActiveSlotRef.current = leftActiveSlot;
    rightActiveSlotRef.current = rightActiveSlot;
    mobileActiveSlotRef.current = mobileActiveSlot;
    leftSlotsRef.current = leftSlots;
    rightSlotsRef.current = rightSlots;
    mobileSlotsRef.current = mobileSlots;
  }, [
    leftActiveSlot,
    rightActiveSlot,
    mobileActiveSlot,
    leftSlots,
    rightSlots,
    mobileSlots,
  ]);

  useEffect(() => {
    const mobileMq = window.matchMedia(mobileMediaQuery);
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncLayout = () => {
      setIsMobile(mobileMq.matches);
      setPrefersReducedMotion(motionMq.matches);
    };

    syncLayout();
    mobileMq.addEventListener("change", syncLayout);
    motionMq.addEventListener("change", syncLayout);

    return () => {
      mobileMq.removeEventListener("change", syncLayout);
      motionMq.removeEventListener("change", syncLayout);
    };
  }, [mobileMediaQuery]);

  const commitPendingSlot = useCallback(
    (
      slot: 0 | 1,
      pendingRef: MutableRefObject<0 | 1 | null>,
      setActiveSlot: (slot: 0 | 1) => void
    ) => {
      if (pendingRef.current === slot) {
        setActiveSlot(slot);
        pendingRef.current = null;
      }
    },
    []
  );

  const advanceLeft = useCallback(() => {
    const otherSrc =
      rightSlotsRef.current[rightActiveSlotRef.current]?.src ?? "";
    const nextLeft = advanceIndex(
      leftIndices,
      leftIndexRef.current,
      otherSrc,
      pool
    );
    const inactive: 0 | 1 = leftActiveSlotRef.current === 0 ? 1 : 0;

    leftIndexRef.current = nextLeft;
    leftPendingRef.current = inactive;
    setLeftSlots((prev) => {
      const next = [...prev] as [HeroSlideSlot, HeroSlideSlot];
      next[inactive] = {
        src: pool[leftIndices[nextLeft]!]!,
        alt: `Slide ${nextLeft + 1}`,
      };
      return next;
    });
  }, [leftIndices, pool]);

  const advanceRight = useCallback(() => {
    const otherSrc = leftSlotsRef.current[leftActiveSlotRef.current]?.src ?? "";
    const nextRight = advanceIndex(
      rightIndices,
      rightIndexRef.current,
      otherSrc,
      pool
    );
    const inactive: 0 | 1 = rightActiveSlotRef.current === 0 ? 1 : 0;

    rightIndexRef.current = nextRight;
    rightPendingRef.current = inactive;
    setRightSlots((prev) => {
      const next = [...prev] as [HeroSlideSlot, HeroSlideSlot];
      next[inactive] = {
        src: pool[rightIndices[nextRight]!]!,
        alt: `Slide ${nextRight + 1}`,
      };
      return next;
    });
  }, [pool, rightIndices]);

  const advanceMobile = useCallback(() => {
    const next = (mobileIndexRef.current + 1) % pool.length;
    const inactive: 0 | 1 = mobileActiveSlotRef.current === 0 ? 1 : 0;

    mobileIndexRef.current = next;
    mobilePendingRef.current = inactive;
    setMobileSlots((prev) => {
      const slots = [...prev] as [HeroSlideSlot, HeroSlideSlot];
      slots[inactive] = {
        src: pool[next]!,
        alt: `Slide ${next + 1}`,
      };
      return slots;
    });
  }, [pool]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) {
      return;
    }

    if (isMobile) {
      const intervalId = window.setInterval(advanceMobile, intervalMs);
      return () => window.clearInterval(intervalId);
    }

    const leftIntervalId = window.setInterval(advanceLeft, intervalMs);
    let rightIntervalId: number | undefined;
    const rightDelayId = window.setTimeout(() => {
      rightIntervalId = window.setInterval(advanceRight, intervalMs);
    }, intervalMs / 2);

    return () => {
      window.clearInterval(leftIntervalId);
      window.clearTimeout(rightDelayId);
      if (rightIntervalId) {
        window.clearInterval(rightIntervalId);
      }
    };
  }, [
    advanceLeft,
    advanceMobile,
    advanceRight,
    intervalMs,
    isMobile,
    isPaused,
    prefersReducedMotion,
  ]);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsPaused((paused) => !paused);
  };

  const heroClass = isPaused ? `${heroClassName} sw-hero--paused` : heroClassName;

  return (
    <div className={heroClass} data-testid={testId}>
      <div className="sw-hero__bounds">
        <Link
          href={resolveLinkHref(mainHref)}
          className="sw-hero__main"
          data-hp-section={mainHpSection}
          data-hp-slot={mainHpSlot}
        >
          <HeroSlide
            className="sw-hero__carousel sw-hero__carousel--left"
            slots={leftSlots}
            activeSlot={leftActiveSlot}
            onImageLoad={(slot) =>
              commitPendingSlot(slot, leftPendingRef, setLeftActiveSlot)
            }
          />
          <HeroSlide
            className="sw-hero__carousel sw-hero__carousel--right"
            slots={rightSlots}
            activeSlot={rightActiveSlot}
            onImageLoad={(slot) =>
              commitPendingSlot(slot, rightPendingRef, setRightActiveSlot)
            }
          />
          <HeroSlide
            className="sw-hero__carousel sw-hero__carousel--mobile"
            slots={mobileSlots}
            activeSlot={mobileActiveSlot}
            onImageLoad={(slot) =>
              commitPendingSlot(slot, mobilePendingRef, setMobileActiveSlot)
            }
          />
          <div id={overlayId} className="sw-hero__overlay"></div>
          <div className="sw-hero__content">
            <div className="sw-hero__copy">
              <div className="sw-hero__eyebrow" style={eyebrow.style}>
                {eyebrow.text}
              </div>
              <div className="sw-hero__headline animate__animated animate__fadeIn sw-hero__headline--logo">
                <img src={lockupSrc} alt={headline.alt} />
              </div>
              <p
                className="sw-hero__subhead animate__animated animate__fadeIn"
                style={subhead.style}
              >
                {subhead.text}
              </p>
              <span
                className="sw-hero__cta sw-hero__cta--solid animate__animated animate__fadeIn"
                style={cta.style}
              >
                {cta.text}
              </span>
            </div>
          </div>
          <HeroControls isPaused={isPaused} onToggle={handleToggle} />
        </Link>
      </div>
      <div className="sw-hero__stripe" style={stripe.style}>
        <strong>{stripe.strongText}</strong>
        {stripe.links.map((link) => (
          <Link
            key={link.href}
            href={resolveLinkHref(link.href)}
            data-hp-section={link.hpSection}
            data-hp-slot={link.hpSlot}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
