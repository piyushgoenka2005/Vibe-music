"use client";

import { Gp9Image as Image } from "@/gp9/components/gp9-image";
import Link from "next/link";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { TiltCard } from "@/gp9/components/ui/tilt-card";
import { ROLAND_LINEUP } from "@/gp9/lib/gp9-assets";

const models = [
  {
    name: "GP-3",
    tag: "Micro Grand",
    description: "Low-profile grand with a space-saving footprint and Piano Reality Standard sound.",
    image: `${ROLAND_LINEUP}/gp_series_gp-3_lineup.jpg`,
    href: "https://www.roland.com/global/products/gp-3/",
  },
  {
    name: "GP-6",
    tag: "Mini Grand",
    description: "Elegant baby grand cabinet with advanced Piano Reality Modeling.",
    image: `${ROLAND_LINEUP}/gp_series_gp-6_lineup.jpg`,
    href: "https://www.roland.com/global/products/gp-6/",
  },
  {
    name: "GP-9",
    tag: "Grand Piano",
    description: "Roland's premier digital grand with Piano Reality Modeling and projection sound.",
    image: "https://static.roland.com/products/gp-9/images/gp-9_hero.jpg",
    href: "#products",
    featured: true,
  },
  {
    name: "GP-9M",
    tag: "Performance Grand",
    description: "GP-9 expanded with moving keys, pro audio outputs, and a microphone input.",
    image: `${ROLAND_LINEUP}/gp_series_gp-9m_lineup.jpg`,
    href: "https://www.roland.com/global/products/gp-9m/",
  },
];

export function LineupSection() {
  return (
    <section id="series" className="scroll-mt-24 bg-background">
      <SectionHeading
        label="GP Series"
        title="Other models in the series."
        subtitle="From compact living spaces to performance venues — there is a GP model for every room."
        className="py-20 md:py-28 lg:pb-12"
      />

      <div className="grid grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-2 lg:grid-cols-4 lg:px-20 md:px-12">
        {models.map((model, index) => (
          <ScrollReveal key={model.name} delay={index * 100} variant="up">
            <TiltCard>
              <Link
                href={model.href}
                className="group block cursor-target card-border-reveal"
                data-cursor-target
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary card-shine">
                  <Image
                    src={model.image}
                    alt={`Roland ${model.name} digital grand piano`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute right-4 top-4">
                    <NavArrowIcon
                      size="sm"
                      className="border-white/20 bg-white/10 text-white group-hover:bg-white group-hover:text-foreground"
                    />
                  </div>
                  {model.featured && (
                    <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">
                      Current
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{model.tag}</p>
                    <p className="mt-1 font-display text-2xl font-medium text-white">{model.name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      {model.description}
                    </p>
                  </div>
                </div>
              </Link>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
