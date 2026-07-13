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
        subtitle="Drag to rotate through GP-9 studio angles. When Roland’s full spin sequence is available we use it; otherwise you get a smooth multi-angle gallery rotation."
        className="py-20 md:py-28 lg:pb-12"
      />

      <ScrollReveal variant="scale" className="mx-auto max-w-4xl px-6 pb-24 md:px-12 lg:px-20">
        <ProductSpinner />
      </ScrollReveal>
    </section>
  );
}
