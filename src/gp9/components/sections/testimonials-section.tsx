"use client";

import Image from "next/image";

export function TestimonialsSection() {
  return (
    <section className="w-full bg-background">
      {/* Large Text Statement */}
      <div className="px-4 py-16 sm:px-6 md:px-10 md:py-24 lg:px-16 lg:py-28">
        <p className="mx-auto max-w-5xl text-2xl leading-relaxed text-foreground md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          The Roland GP-9 brings the presence of a concert grand into your living room — 
          refined design, responsive touch, and a sound that fills every corner of the space.
        </p>
      </div>

      {/* About Image */}
      <div className="relative aspect-[16/9] w-full">
        <Image
          src="https://static.roland.com/products/gp-9/images/gallery/gp-9_angle_open_gal.jpg"
          alt="Roland GP-9 Digital Grand Piano with lid open"
          fill
          className="object-cover"
        />
        {/* Fade gradient overlay - white at bottom fading to transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
    </section>
  );
}
