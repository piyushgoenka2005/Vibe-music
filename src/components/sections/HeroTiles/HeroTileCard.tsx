import Link from "next/link";
import type { HeroTileItem } from "@/data/heroTiles";
import { resolveLinkHref } from "@/lib/routes";

interface HeroTileCardProps {
  item: HeroTileItem;
}

export default function HeroTileCard({ item }: HeroTileCardProps) {
  const [wideSource, narrowSource] = item.sources;

  return (
    <div className={`hero-tile ${item.sizeClass}`}>
      <Link
        href={resolveLinkHref(item.href)}
        className="hero-tile__link"
        data-hp-section="hero"
        data-hp-slot={item.hpSlot}
      >
        <picture>
          <source
            type="image/webp"
            srcSet={wideSource.srcSet}
            sizes={wideSource.sizes}
            media={wideSource.media}
            width={wideSource.width}
            height={wideSource.height}
          />
          <source
            type="image/webp"
            srcSet={narrowSource.srcSet}
            sizes={narrowSource.sizes}
            media={narrowSource.media}
            width={narrowSource.width}
            height={narrowSource.height}
          />
          <img
            src={item.imgSrc}
            alt={item.imgAlt}
            width={item.imgWidth}
            height={item.imgHeight}
          />
        </picture>
      </Link>
    </div>
  );
}
