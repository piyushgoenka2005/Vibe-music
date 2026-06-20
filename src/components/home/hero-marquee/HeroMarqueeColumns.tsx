import type { HeroMarqueeProduct } from "@/data/heroMarqueeProducts";
import { GrowthIcon } from "@/components/home/hero-marquee/icons";

function MarqueeCard({ item }: { item: HeroMarqueeProduct }) {
  return (
    <>
      <div className="hero_marquee_img-wrap">
        <img
          alt={item.imageAlt}
          className="hero_marquee_img"
          decoding="async"
          fetchPriority="low"
          height={40}
          loading="lazy"
          src={item.image}
          width={40}
        />
      </div>
      <div className="hero_marquee_text-wrap">
        <p className="hero_marquee_text text-weight-semibold">{item.name}</p>
        <div className="hero_marquee_rev_wrap">
          <p className="hero_marquee_text text-size-tiny text-weight-medium">
            Price {item.price}
          </p>
        </div>
      </div>
      <div className="hero_marquee_item-line" aria-hidden />
      <div className="hero_marquee_text-wrap is-right">
        <p className="hero_marquee_text text-weight-semibold text-color-brand">
          {item.revenue}
        </p>
        <div className="hero_marquee_rev_wrap">
          <p className="hero_marquee_text text-size-tiny text-weight-medium">
            Revenue
          </p>
          <div className="hero_marquee_rev_stat">
            <GrowthIcon />
            <span className="hero_marquee_rev_pct">{item.growth}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function MarqueePanel({
  items,
  panelKey,
}: {
  items: HeroMarqueeProduct[];
  panelKey: string;
}) {
  return (
    <div className="hero_marquee_panel" aria-hidden={panelKey.endsWith("-b")}>
      <ul className="hero_marquee_list">
        {items.map((item) => (
          <li key={`${panelKey}-${item.id}`} className="hero_marquee_item">
            <MarqueeCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface MarqueeColumnProps {
  items: HeroMarqueeProduct[];
  direction: "up" | "down";
  duration: number;
  opacity: number;
  columnIndex: number;
}

export default function MarqueeColumn({
  items,
  direction,
  duration,
  opacity,
  columnIndex,
}: MarqueeColumnProps) {
  return (
    <div
      className={`hero_marquee_column${columnIndex % 2 === 0 ? " hero_marquee_column--tint" : ""}`}
      data-column={columnIndex}
      style={{ opacity }}
    >
      <div className="hero_marquee_track">
        <div
          className={`hero_marquee_scroll hero_marquee_scroll--${direction}`}
          style={{ animationDuration: `${duration}s` }}
        >
          <MarqueePanel items={items} panelKey={`col-${columnIndex}-a`} />
          <MarqueePanel items={items} panelKey={`col-${columnIndex}-b`} />
        </div>
      </div>
    </div>
  );
}
