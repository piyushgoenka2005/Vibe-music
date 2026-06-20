"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GUITAR_TONES_IN_MOTION_VIDEOS } from "@/data/guitarTonesInMotionVideos";
import "./guitar-tones-in-motion.css";

export default function GuitarTonesInMotion() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBySlide = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const slide = track.querySelector<HTMLElement>(".guitar-tones__slide");
    const slideWidth = slide?.offsetWidth ?? track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 10;

    track.scrollBy({
      left: direction * (slideWidth + gap),
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") scrollBySlide(-1);
      if (event.key === "ArrowRight") scrollBySlide(1);
    };

    track.addEventListener("keydown", onKeyDown);
    return () => track.removeEventListener("keydown", onKeyDown);
  }, [scrollBySlide]);

  return (
    <section className="guitar-tones" aria-labelledby="guitar-tones-title">
      <div className="guitar-tones__pattern" aria-hidden="true" />
      <div className="guitar-tones__inner">
        <div className="guitar-tones__header">
          <span className="guitar-tones__divider" aria-hidden="true" />
          <h2 id="guitar-tones-title" className="guitar-tones__title">
            Tones In Motion
          </h2>
          <span className="guitar-tones__divider" aria-hidden="true" />
        </div>

        <div className="guitar-tones__carousel">
          <button
            type="button"
            className="guitar-tones__arrow guitar-tones__arrow--prev"
            aria-label="Previous video"
            onClick={() => scrollBySlide(-1)}
          >
            <ChevronLeft aria-hidden="true" size={22} strokeWidth={2.25} />
          </button>

          <div
            ref={trackRef}
            className="guitar-tones__track"
            role="region"
            aria-roledescription="carousel"
            aria-label="Guitar tone demonstration videos"
            tabIndex={0}
          >
            {GUITAR_TONES_IN_MOTION_VIDEOS.map((video) => (
              <article
                key={video.id}
                className="guitar-tones__slide"
                aria-label={video.title}
              >
                <div className="guitar-tones__video">
                  <iframe
                    src={video.embedUrl}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="guitar-tones__arrow guitar-tones__arrow--next"
            aria-label="Next video"
            onClick={() => scrollBySlide(1)}
          >
            <ChevronRight aria-hidden="true" size={22} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </section>
  );
}
