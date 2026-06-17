"use client";

import { FadeImage } from "@/gp9/components/fade-image";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";

const ROLAND_GP9 = "https://static.roland.com/products/gp-9/images";

const features = [
  {
    title: "Piano Reality Sound",
    description: "Tone",
    image: `${ROLAND_GP9}/gp-9_more_info_1.jpg`,
  },
  {
    title: "Hybrid Grand Keyboard",
    description: "Touch",
    image: `${ROLAND_GP9}/gp-9_more_info_2.jpg`,
  },
  {
    title: "Piano Reality Projection",
    description: "Acoustics",
    image: `${ROLAND_GP9}/gp-9_more_info_3.jpg`,
  },
  {
    title: "Smart Touch Panel",
    description: "Control",
    image: `${ROLAND_GP9}/gp-9_more_info_4.jpg`,
  },
  {
    title: "Roland Piano App",
    description: "Connectivity",
    image: `${ROLAND_GP9}/gp-9_more_info_5.jpg`,
  },
  {
    title: "Integrated Casters",
    description: "Mobility",
    image: `${ROLAND_GP9}/gp-9_more_info_6.jpg`,
  },
];

export function FeaturedProductsSection() {
  return (
    <section id="technology" className="relative scroll-mt-24 overflow-hidden bg-background">
      <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-secondary blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -left-20 bottom-20 h-48 w-48 rounded-full bg-muted blur-3xl animate-float-slow [animation-delay:2s]" />

      <SectionHeading
        label="Technology"
        title="Engineered for the concert hall."
        subtitle="Every detail — from key action to speaker placement — is tuned for an authentic grand piano experience."
        className="py-20 md:py-28 lg:pb-16"
      />

      <div className="grid grid-cols-1 gap-6 px-6 pb-20 md:grid-cols-3 md:px-12 lg:px-20">
        {features.map((feature, index) => (
          <ScrollReveal key={feature.title} delay={index * 80} variant={index % 2 === 0 ? "up" : "scale"}>
            <div className="group cursor-target">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl card-shine">
                <FadeImage
                  src={feature.image || "/placeholder.svg"}
                  alt={feature.title}
                  fill
                  fadeDelay={index * 100}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
                <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white backdrop-blur-md">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="py-6 transition-transform duration-500 group-hover:translate-x-1">
                <p className="mb-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  {feature.description}
                </p>
                <h3 className="text-xl font-semibold text-foreground transition-colors group-hover:text-foreground/80">
                  {feature.title}
                </h3>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
