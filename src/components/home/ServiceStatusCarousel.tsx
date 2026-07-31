"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LANDING_SERVICE_STATUS,
  LANDING_TRUST_ITEMS,
} from "@/data/landingStatus";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import Reveal from "@/components/layout/Reveal";

type CarouselItem = {
  id: string;
  category: string;
  title: string;
  desc: string;
  href?: string;
};

const SERVICE_CATEGORIES = ["Orders", "Payments", "Fulfillment", "Support"] as const;

const TRUST_CATEGORIES = ["Delivery", "Trust", "Returns", "Support"] as const;

const CAROUSEL_ITEMS: CarouselItem[] = [
  ...LANDING_SERVICE_STATUS.map((item, index) => ({
    id: `service-${index}`,
    category: SERVICE_CATEGORIES[index] ?? "Service",
    title: item.title,
    desc: item.desc,
    href: item.href,
  })),
  ...LANDING_TRUST_ITEMS.map((item, index) => ({
    id: `trust-${index}`,
    category: TRUST_CATEGORIES[index] ?? "Trust",
    title: item.title,
    desc: item.desc,
    href: item.href,
  })),
];

function ServiceCarouselCard({
  item,
  index,
  isDuplicate = false,
}: {
  item: CarouselItem;
  index: number;
  isDuplicate?: boolean;
}) {
  const cardContent = (
    <>
      <div className="service-carousel__card-head">
        <span className="service-carousel__card-category">{item.category}</span>
        <span className="service-carousel__card-index" aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="service-carousel__card-body">
        <h3 className="service-carousel__card-title">{item.title}</h3>
        <p className="service-carousel__card-desc">{item.desc}</p>
      </div>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="service-carousel__card"
        role="listitem"
        aria-hidden={isDuplicate ? true : undefined}
        tabIndex={isDuplicate ? -1 : undefined}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article
      className="service-carousel__card"
      role="listitem"
      aria-hidden={isDuplicate ? true : undefined}
    >
      {cardContent}
    </article>
  );
}

export default function ServiceStatusCarousel() {
  const reduceMotion = useHydrationSafeReducedMotion();
  const enableAutoScroll = !reduceMotion;
  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const displayItems = enableAutoScroll
    ? [...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS]
    : CAROUSEL_ITEMS;

  const trackWrapClassName = [
    "service-carousel__track-wrap",
    enableAutoScroll && "service-carousel__track-wrap--marquee",
  ]
    .filter(Boolean)
    .join(" ");

  const trackClassName = [
    "service-carousel__track",
    enableAutoScroll && "service-carousel__track--marquee",
  ]
    .filter(Boolean)
    .join(" ");

  const updatePageState = useCallback(() => {
    const track = trackRef.current;
    if (!track || enableAutoScroll) return;

    const card = track.querySelector<HTMLElement>(".service-carousel__card");
    const cardWidth = card?.offsetWidth ?? 1;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const visible = Math.max(1, Math.round(track.clientWidth / (cardWidth + gap)));
    const pages = Math.max(1, Math.ceil(CAROUSEL_ITEMS.length / visible));
    const scrollIndex = Math.round(track.scrollLeft / (cardWidth + gap));
    const page = Math.min(pages - 1, Math.floor(scrollIndex / visible));

    setPageCount(pages);
    setActivePage(page);
  }, [enableAutoScroll]);

  useEffect(() => {
    if (enableAutoScroll) return undefined;

    const track = trackRef.current;
    if (!track) return undefined;

    updatePageState();
    track.addEventListener("scroll", updatePageState, { passive: true });
    window.addEventListener("resize", updatePageState);

    return () => {
      track.removeEventListener("scroll", updatePageState);
      window.removeEventListener("resize", updatePageState);
    };
  }, [enableAutoScroll, updatePageState]);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track || enableAutoScroll) return;

    const card = track.querySelector<HTMLElement>(".service-carousel__card");
    const cardWidth = card?.offsetWidth ?? track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const visible = Math.max(1, Math.round(track.clientWidth / (cardWidth + gap)));
    const delta = direction * visible * (cardWidth + gap);

    track.scrollBy({ left: delta, behavior: "smooth" });
  };

  const scrollToPage = (page: number) => {
    const track = trackRef.current;
    if (!track || enableAutoScroll) return;

    const card = track.querySelector<HTMLElement>(".service-carousel__card");
    const cardWidth = card?.offsetWidth ?? track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const visible = Math.max(1, Math.round(track.clientWidth / (cardWidth + gap)));

    track.scrollTo({ left: page * visible * (cardWidth + gap), behavior: "smooth" });
  };

  return (
    <section className="service-carousel" aria-labelledby="service-carousel-title">
      <div className="service-carousel__inner">
        <Reveal className="service-carousel__intro" immediate>
          <p className="service-carousel__eyebrow">Why Vibe Music</p>
          <h2 id="service-carousel-title" className="service-carousel__title">
            Gear shopping, without the guesswork
          </h2>
          <p className="service-carousel__subtitle">
            Orders, payments, dispatch, and support — transparent at every step so you can
            focus on the music.
          </p>

          {!enableAutoScroll ? (
            <div className="service-carousel__controls">
              <div className="service-carousel__arrows">
                <button
                  type="button"
                  className="service-carousel__arrow"
                  aria-label="Previous features"
                  onClick={() => scrollByPage(-1)}
                >
                  <ChevronLeft size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  className="service-carousel__arrow"
                  aria-label="Next features"
                  onClick={() => scrollByPage(1)}
                >
                  <ChevronRight size={18} aria-hidden />
                </button>
              </div>

              <div className="service-carousel__dots" role="tablist" aria-label="Feature pages">
                {Array.from({ length: pageCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    aria-selected={activePage === index}
                    aria-label={`Go to page ${index + 1}`}
                    className={`service-carousel__dot${
                      activePage === index ? " service-carousel__dot--active" : ""
                    }`}
                    onClick={() => scrollToPage(index)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </Reveal>

        <div className={trackWrapClassName}>
          <div ref={trackRef} className={trackClassName} role="list">
            {displayItems.map((item, index) => (
              <ServiceCarouselCard
                key={`${item.id}-${index}`}
                item={item}
                index={index % CAROUSEL_ITEMS.length}
                isDuplicate={enableAutoScroll && index >= CAROUSEL_ITEMS.length}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={[
          "service-carousel__ledger",
          enableAutoScroll ? "service-carousel__ledger--marquee" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Store services at a glance"
      >
        <div
          className={[
            "service-carousel__ledger-track",
            enableAutoScroll ? "service-carousel__ledger-track--marquee" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {(enableAutoScroll ? [...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS] : CAROUSEL_ITEMS).map(
            (item, index) => {
              const isDuplicate = enableAutoScroll && index >= CAROUSEL_ITEMS.length;
              const content = (
                <>
                  <span className="service-carousel__ledger-category">{item.category}</span>
                  <span className="service-carousel__ledger-title">{item.title}</span>
                  <span className="service-carousel__ledger-desc">{item.desc}</span>
                </>
              );

              if (item.href) {
                return (
                  <Link
                    key={`${item.id}-${index}`}
                    href={item.href}
                    className="service-carousel__ledger-item"
                    aria-hidden={isDuplicate ? true : undefined}
                    tabIndex={isDuplicate ? -1 : undefined}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="service-carousel__ledger-item"
                  aria-hidden={isDuplicate ? true : undefined}
                >
                  {content}
                </div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}
