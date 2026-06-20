"use client";

import Image from "next/image";
import { GUITAR_STORY_BANNERS } from "@/data/guitarStorySections";
import "./guitar-story-sections.css";

export default function GuitarStorySections() {
  return (
    <div className="guitar-story">
      {GUITAR_STORY_BANNERS.map((banner) => (
        <section
          key={banner.id}
          className="guitar-story__banner"
          aria-label={banner.imageAlt}
        >
          <Image
            src={banner.imageSrc}
            alt={banner.imageAlt}
            width={1920}
            height={640}
            className="guitar-story__image"
            sizes="100vw"
            priority={false}
          />
        </section>
      ))}
    </div>
  );
}
