import HomePage from "@/components/home/HomePage";
import { HERO_SHOWCASE_SCENES } from "@/data/heroShowcaseScenes";

/** Cache rendered homepage HTML for 60s — faster repeat visits in production. */
export const revalidate = 60;

const HERO_PRELOAD = HERO_SHOWCASE_SCENES[0]?.src;

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
