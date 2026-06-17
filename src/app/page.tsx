import HomePage from "@/components/home/HomePage";
import { MARKETING_HERO_SLIDES } from "@/data/marketingHeroSlides";

const HERO_PRELOAD = MARKETING_HERO_SLIDES[0]?.src;

export default function Home() {
  return (
    <>
      {HERO_PRELOAD ? (
        <link rel="preload" as="image" href={HERO_PRELOAD} fetchPriority="high" />
      ) : null}
      <HomePage />
    </>
  );
}
