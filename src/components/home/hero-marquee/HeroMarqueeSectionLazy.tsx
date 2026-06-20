"use client";

import dynamic from "next/dynamic";

const HeroMarqueeSection = dynamic(
  () => import("@/components/home/hero-marquee/HeroMarqueeSection"),
  { loading: () => null }
);

export default HeroMarqueeSection;
