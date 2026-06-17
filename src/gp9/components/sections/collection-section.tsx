"use client";

import { FadeImage } from "@/gp9/components/fade-image";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";

const ROLAND_GALLERY = "https://static.roland.com/products/gp-9/images/gallery";

const highlights = [
  {
    id: 1,
    name: "Smart Touch Panel",
    description: "Intuitive controls at your fingertips",
    tag: "Interface",
    image: `${ROLAND_GALLERY}/gp-9_panel_1_gal.jpg`,
  },
  {
    id: 2,
    name: "Piano Reality Speakers",
    description: "Multi-directional sound projection",
    tag: "Acoustics",
    image: `${ROLAND_GALLERY}/gp-9_speakers_gal.jpg`,
  },
  {
    id: 3,
    name: "Roland Piano App",
    description: "Customize tone and settings wirelessly",
    tag: "App",
    image: `${ROLAND_GALLERY}/gp-9_ipad_1_gal.jpg`,
  },
  {
    id: 4,
    name: "Hybrid Pedals",
    description: "Progressive damper and sostenuto response",
    tag: "Expression",
    image: `${ROLAND_GALLERY}/gp-9_pedals_gal.jpg`,
  },
  {
    id: 5,
    name: "Audio Connections",
    description: "Balanced outputs for home and stage",
    tag: "Connectivity",
    image: `${ROLAND_GALLERY}/gp-9_jacks_gal.jpg`,
  },
  {
    id: 6,
    name: "Integrated Casters",
    description: "Move your grand piano with ease",
    tag: "Design",
    image: `${ROLAND_GALLERY}/gp-9_casters_gal.jpg`,
  },
];

export function CollectionSection() {
  return (
    <section id="accessories" className="relative overflow-hidden bg-background">
      <SectionHeading
        label="Details"
        title="Crafted inside and out."
        subtitle="From the speaker array to the pedal mechanism — every component serves the performance."
        className="py-20 md:py-10"
      />

      <div className="pb-24">
        <div
          className="flex gap-6 overflow-x-auto px-6 pb-4 md:hidden snap-x snap-mandatory scrollbar-hide"
          data-lenis-prevent
        >
          {highlights.map((item, index) => (
            <ScrollReveal key={item.id} delay={index * 60} variant="scale">
              <div className="group w-[75vw] flex-shrink-0 snap-center cursor-target">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-secondary card-shine">
                  <FadeImage
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white backdrop-blur-sm">
                    {item.tag}
                  </span>
                </div>
                <div className="py-6">
                  <h3 className="text-lg font-medium leading-snug text-foreground">{item.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="hidden md:grid md:grid-cols-3 md:gap-8 md:px-12 lg:px-20">
          {highlights.map((item, index) => (
            <ScrollReveal key={item.id} delay={index * 80} variant={index % 3 === 1 ? "scale" : "up"}>
              <div className="group cursor-target">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-secondary card-shine">
                  <FadeImage
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white backdrop-blur-sm">
                    {item.tag}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-6 transition-transform duration-500 group-hover:translate-y-0">
                    <p className="text-sm text-white/80">{item.description}</p>
                  </div>
                </div>
                <div className="py-6">
                  <h3 className="text-lg font-medium leading-snug text-foreground">{item.name}</h3>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
