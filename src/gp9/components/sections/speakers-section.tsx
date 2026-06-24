"use client";

import { LazyVideo } from "@/gp9/components/ui/lazy-video";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { GP9_VIDEOS, ROLAND_GP9 } from "@/gp9/lib/gp9-assets";

export function SpeakersSection() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <SectionHeading
        label="Acoustics"
        title="A full-immersion sound experience."
        subtitle="Piano Reality Projection combines multi-channel amplification, premium circuitry, and eight speakers tuned to the cabinet — bold, immersive, and concert-hall present."
        className="py-20 md:py-28 [&_h2]:text-background [&_p]:text-background/60"
      />

      <ScrollReveal variant="scale">
        <div className="relative mx-6 aspect-[16/9] overflow-hidden rounded-2xl md:mx-12 lg:mx-20 md:aspect-[21/9]">
          <LazyVideo
            src={GP9_VIDEOS.speakers}
            poster={`${ROLAND_GP9}/gp_series_immersive_sound.jpg`}
            ariaLabel="GP-9 Piano Reality Projection speaker system"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <p className="text-xs uppercase tracking-[0.35em] text-background/50">Piano Reality Projection</p>
            <p className="mt-3 max-w-lg font-display text-2xl font-medium text-background md:text-3xl">
              Eight speakers. One concert grand in your room.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 gap-px bg-background/10 px-6 py-16 md:grid-cols-4 md:px-12 lg:px-20">
        {[
          { label: "Spatial speakers", value: "2 × 16 cm" },
          { label: "Cabinet speaker", value: "25 cm" },
          { label: "Center near-field", value: "2 × 8 cm" },
          { label: "Rated output", value: "75 W total" },
        ].map((item, index) => (
          <ScrollReveal key={item.label} delay={index * 80} variant="up">
            <div className="px-4 py-6 text-center md:px-6">
              <p className="text-xs uppercase tracking-[0.3em] text-background/50">{item.label}</p>
              <p className="mt-2 font-display text-xl font-medium text-background md:text-2xl">{item.value}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
