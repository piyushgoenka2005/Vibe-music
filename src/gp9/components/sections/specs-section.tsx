"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/gp9/components/ui/accordion";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";

const specGroups = [
  {
    title: "Sound Generator",
    items: [
      ["Piano sound", "Piano Reality Modeling"],
      ["Max. polyphony", "Piano: Limitless (solo piano tones) · Other: 256"],
      ["Tones", "324 total — Grand: 4 · Upright: 5 · E.Piano: 12 · Organ: 12"],
      ["Ambience", "Studio, Lounge, Concert Hall, Wooden Hall, Stone Hall, Cathedral"],
    ],
  },
  {
    title: "Keyboard & Pedals",
    items: [
      ["Keyboard", "Hybrid Grand — 88 keys, escapement, Ivory Feel, haptic vibration"],
      ["Touch sensitivity", "Key Touch: 100 steps · Hammer Response: 10 steps"],
      ["Pedals", "Damper (continuous, damper modeling) · Soft · Sostenuto"],
      ["Master tuning", "415.3–466.2 Hz (0.1 Hz increments)"],
    ],
  },
  {
    title: "Sound System",
    items: [
      ["System", "Piano Reality Projection"],
      ["Speakers", "8 speakers — spatial, cabinet, center near-field, near-field"],
      ["Power output", "25 W × 2 · 20 W × 2 · 15 W × 2 · 15 W × 2"],
      ["Headphones", "Piano Reality Headphones Ambience"],
    ],
  },
  {
    title: "Connectivity & Features",
    items: [
      ["Bluetooth", "Ver 4.2 — A2DP audio & BLE MIDI"],
      ["Apps", "Roland Piano App, Piano Designer"],
      ["USB", "Computer (MIDI/Audio) · Memory (flash drive)"],
      ["Functions", "Twin Piano · Metronome · Recorder · 394 onboard songs"],
    ],
  },
  {
    title: "Dimensions & Weight",
    items: [
      ["Width", "1,445 mm (56-15/16\") lid open"],
      ["Depth", "1,501 mm (59-1/8\")"],
      ["Height", "1,787 mm (70-3/8\") lid open · 999 mm closed"],
      ["Weight", "169.0 kg (372 lbs 10 oz)"],
    ],
  },
];

export function SpecsSection() {
  return (
    <section id="specs" className="scroll-mt-24 border-t border-border bg-background">
      <SectionHeading
        label="Specifications"
        title="Every detail, documented."
        subtitle="Full GP-9 technical specifications — sound engine, keyboard, speakers, connectivity, and dimensions."
        className="py-20 md:py-28 lg:pb-12"
      />

      <ScrollReveal className="mx-auto max-w-3xl px-6 pb-24 md:px-12 lg:px-20">
        <Accordion type="single" collapsible className="w-full">
          {specGroups.map((group) => (
            <AccordionItem key={group.title} value={group.title}>
              <AccordionTrigger className="font-display text-lg font-medium hover:no-underline md:text-xl">
                {group.title}
              </AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-4 pb-2">
                  {group.items.map(([label, value]) => (
                    <div key={label} className="grid gap-1 border-b border-border/60 pb-4 last:border-0 md:grid-cols-[10rem_1fr] md:gap-6">
                      <dt className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</dt>
                      <dd className="text-sm leading-relaxed text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>
    </section>
  );
}
