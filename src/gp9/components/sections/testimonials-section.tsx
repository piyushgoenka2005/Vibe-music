"use client";

import { Gp9Image as Image } from "@/gp9/components/gp9-image";
import { ROLAND_GALLERY } from "@/gp9/lib/gp9-assets";

export function TestimonialsSection() {
  return (
    <section id="statement" className="w-full bg-background">
      <div className="px-4 py-16 sm:px-6 md:px-10 md:py-24 lg:px-16 lg:py-28">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Presence</p>
        <p className="mx-auto mt-6 max-w-5xl text-2xl leading-relaxed text-foreground md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          The Roland GP-9 brings the presence of a concert grand into your living room —
          refined design, responsive touch, and a sound that fills every corner of the space.
        </p>
      </div>

      <div className="relative aspect-[16/9] w-full">
        <Image
          src={`${ROLAND_GALLERY}/gp-9_angle_open_gal.jpg`}
          alt="Roland GP-9 Digital Grand Piano with lid open"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
    </section>
  );
}
