"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LANDING_SERVICE_STATUS,
  LANDING_TRUST_ITEMS,
} from "@/data/landingStatus";
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
  })),
];

export default function ServiceStatusCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const updatePageState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>(".service-carousel__card");
    const cardWidth = card?.offsetWidth ?? 1;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const visible = Math.max(1, Math.round(track.clientWidth / (cardWidth + gap)));
    const pages = Math.max(1, Math.ceil(CAROUSEL_ITEMS.length / visible));
    const scrollIndex = Math.round(track.scrollLeft / (cardWidth + gap));
    const page = Math.min(pages - 1, Math.floor(scrollIndex / visible));

    setPageCount(pages);
    setActivePage(page);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updatePageState();
    track.addEventListener("scroll", updatePageState, { passive: true });
    window.addEventListener("resize", updatePageState);

    return () => {
      track.removeEventListener("scroll", updatePageState);
      window.removeEventListener("resize", updatePageState);
    };
  }, [updatePageState]);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>(".service-carousel__card");
    const cardWidth = card?.offsetWidth ?? track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const visible = Math.max(1, Math.round(track.clientWidth / (cardWidth + gap)));
    const delta = direction * visible * (cardWidth + gap);

    track.scrollBy({ left: delta, behavior: "smooth" });
  };

  const scrollToPage = (page: number) => {
    const track = trackRef.current;
    if (!track) return;

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
        </Reveal>

        <div className="service-carousel__track-wrap">
          <div ref={trackRef} className="service-carousel__track" role="list">
            {CAROUSEL_ITEMS.map((item, index) => {
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
                    key={item.id}
                    href={item.href}
                    className="service-carousel__card"
                    role="listitem"
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <article key={item.id} className="service-carousel__card" role="listitem">
                  {cardContent}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
