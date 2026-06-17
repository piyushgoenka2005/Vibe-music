"use client";

import { useRef } from "react";
import { AnimatedCounter } from "@/gp9/components/ui/animated-counter";
import { Marquee } from "@/gp9/components/ui/marquee";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { ScrollScrubVideo } from "@/gp9/components/ui/scroll-scrub-video";
import { GP9_VIDEOS, ROLAND_GP9 } from "@/gp9/lib/gp9-assets";

const specs = [
  { label: "Keys", value: 88, suffix: "" },
  { label: "Speakers", value: 8, suffix: "" },
  { label: "Tones", value: 324, suffix: "" },
  { label: "Weight", value: 169, suffix: " kg" },
];

const marqueeItems = [
  "Piano Reality Sound",
  "Hybrid Grand Keyboard",
  "Piano Reality Projection",
  "Roland Piano App",
  "Concert Hall Presence",
];

export function EditorialSection() {
  const engageZoneRef = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-background">
      <Marquee items={marqueeItems} />

      <div className="grid grid-cols-2 border-t border-border md:grid-cols-4">
        {specs.map((spec, index) => (
          <ScrollReveal
            key={spec.label}
            delay={index * 100}
            variant="up"
            className="border-b border-r border-border p-8 text-center last:border-r-0 md:border-b-0"
          >
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">{spec.label}</p>
            <p className="font-display text-4xl font-medium text-foreground">
              <AnimatedCounter value={spec.value} suffix={spec.suffix} />
            </p>
          </ScrollReveal>
        ))}
      </div>

      {/* Scroll-scrub zone — lid opens only as you scroll through */}
      <div
        ref={engageZoneRef}
        id="in-motion"
        data-scroll-engage
        className="relative h-[125vh] w-full md:h-[165vh]"
        aria-label="GP-9 lid opening video"
      >
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          <div className="relative h-full w-full overflow-hidden grain-overlay">
            <ScrollScrubVideo
              src={GP9_VIDEOS.openLid}
              poster={`${ROLAND_GP9}/gp-9_hero.jpg`}
              zoneRef={engageZoneRef}
              ariaLabel="GP-9 grand piano lid opening, controlled by scroll"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">In motion</p>
              <p className="mt-2 font-display text-2xl font-medium text-white md:text-3xl">
                The lid rises. The room listens.
              </p>
            </div>
            <div
              className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-700"
              style={{ opacity: "calc(var(--scroll-engage, 0) * 0.85)" }}
            >
              <span className="text-[10px] uppercase tracking-[0.35em] text-white/50">
                Scroll to open
              </span>
              <span className="block h-8 w-px animate-pulse bg-white/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
