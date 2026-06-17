"use client";

import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { ProductSpinner } from "@/gp9/components/ui/product-spinner";

export function SpinnerSection() {
  return (
    <section id="spinner" className="border-t border-border bg-background">
      <SectionHeading
        label="360° View"
        title="Every side, in your hands."
        subtitle="Drag to rotate the GP-9 — explore the cabinet from every angle, just like on Roland's product experience."
        className="py-20 md:py-28 lg:pb-12"
      />

      <ScrollReveal variant="scale" className="mx-auto max-w-4xl px-6 pb-24 md:px-12 lg:px-20">
        <ProductSpinner />
      </ScrollReveal>
    </section>
  );
}
