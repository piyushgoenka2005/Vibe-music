"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { ROLAND_GALLERY } from "@/gp9/lib/gp9-assets";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SKETCHFAB_EMBED =
  "https://sketchfab.com/models/159b0bd1ef114b32888d9d39885cac68/embed";

function SketchfabGrandPiano() {
  return (
    <div className="sketchfab-embed-wrapper relative h-full w-full">
      <iframe
        title="Grand Piano"
        src={SKETCHFAB_EMBED}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; xr-spatial-tracking; execution-while-out-of-viewport; execution-while-not-rendered; web-share"
        className="absolute inset-0 h-full w-full"
      />
      <p className="absolute bottom-2 left-2 z-10 m-0 text-[11px] font-normal text-white/50">
        <a
          href="https://sketchfab.com/3d-models/grand-piano-159b0bd1ef114b32888d9d39885cac68?utm_medium=embed&utm_campaign=share-popup&utm_content=159b0bd1ef114b32888d9d39885cac68"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="font-semibold text-[#1CAAD9] hover:underline"
        >
          Grand Piano
        </a>{" "}
        by{" "}
        <a
          href="https://sketchfab.com/Amatsukast?utm_medium=embed&utm_campaign=share-popup&utm_content=159b0bd1ef114b32888d9d39885cac68"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="font-semibold text-[#1CAAD9] hover:underline"
        >
          Amatsukast
        </a>{" "}
        on{" "}
        <a
          href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=159b0bd1ef114b32888d9d39885cac68"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="font-semibold text-[#1CAAD9] hover:underline"
        >
          Sketchfab
        </a>
      </p>
    </div>
  );
}

export function InteractivePianoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section id="experience" ref={sectionRef} className="border-t border-border bg-background">
      <SectionHeading
        label="Interactive"
        title="Explore the grand piano."
        subtitle="Orbit the cabinet and explore the GP-9 form up close — an interactive 3D model powered by Sketchfab."
        className="py-20 md:py-28 lg:pb-12"
      />

      <ScrollReveal variant="scale" className="mx-6 md:mx-12 lg:mx-20">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <div
            data-lenis-prevent
            className="relative aspect-[16/10] w-full md:aspect-[21/9]"
          >
            {reducedMotion ? (
              <Image
                src={`${ROLAND_GALLERY}/gp-9_angle_open_gal.jpg`}
                alt="Roland GP-9 digital grand piano"
                fill
                className="object-cover"
              />
            ) : mounted ? (
              <SketchfabGrandPiano />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Scroll closer to load 3D…
                </p>
              </div>
            )}
          </div>

          {!reducedMotion && (
            <div className="border-t border-border bg-background px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Drag to orbit · pinch or scroll to zoom
              </p>
            </div>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
