"use client";

import Link from "next/link";
import { LazyVideo } from "@/gp9/components/ui/lazy-video";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { GP9_VIDEOS, ROLAND_LINEUP } from "@/gp9/lib/gp9-assets";

export function MovingKeysSection() {
  return (
    <section id="moving-keys" className="relative overflow-hidden border-t border-border bg-primary text-primary-foreground">
      <SectionHeading
        label="GP-9M"
        title="Moving keys. Living performance."
        subtitle="The GP-9M expands the flagship experience with self-playing keys — ideal for home gatherings, restaurants, hotels, and venues."
        className="py-20 md:py-28 [&_h2]:text-background [&_p]:text-background/60"
      />

      <ScrollReveal variant="scale">
        <div className="relative mx-6 aspect-[16/9] overflow-hidden rounded-2xl md:mx-12 lg:mx-20 md:aspect-[21/9]">
          <LazyVideo
            src={GP9_VIDEOS.movingKeys}
            poster={`${ROLAND_LINEUP}/gp_series_gp-9m_lineup.jpg`}
            ariaLabel="GP-9M moving keys demonstration"
            className="absolute inset-0 h-full w-full object-cover"
            keepPlaying
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <p className="text-xs uppercase tracking-[0.35em] text-background/50">GP-9M feature</p>
            <p className="mt-3 max-w-xl font-display text-2xl font-medium text-background md:text-3xl">
              Watch the keys play themselves — songs from the onboard library or USB MIDI files.
            </p>
            <Link
              href="https://www.roland.com/global/products/gp-9m/"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex w-fit items-center gap-3 rounded-full border border-background/30 px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background hover:text-foreground"
            >
              <span>Explore GP-9M</span>
              <NavArrowIcon
                size="sm"
                className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground group-hover:bg-primary-foreground group-hover:text-primary"
              />
            </Link>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-px bg-background/10 px-6 py-16 md:grid-cols-3 md:px-12 lg:px-20">
        {[
          { label: "Moving keys", value: "Self-playing performance" },
          { label: "Pro audio", value: "Balanced XLR outputs" },
          { label: "Microphone", value: "Vocal input for venues" },
        ].map((item, index) => (
          <ScrollReveal key={item.label} delay={index * 80} variant="up">
            <div className="px-4 py-6 text-center md:px-6">
              <p className="text-xs uppercase tracking-[0.3em] text-background/50">{item.label}</p>
              <p className="mt-2 font-display text-lg font-medium text-background md:text-xl">{item.value}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
