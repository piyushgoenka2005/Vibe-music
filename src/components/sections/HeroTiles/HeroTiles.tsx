import { HERO_TILES } from "@/data/heroTiles";
import HeroTileCard from "./HeroTileCard";

/** Homepage hero tile pair (large + small promotional banners). */
export default function HeroTiles() {
  return (
    <section id={HERO_TILES.sectionId} className="hero-tiles">
      {HERO_TILES.items.map((item) => (
        <HeroTileCard key={item.id} item={item} />
      ))}
    </section>
  );
}
