import Image from "next/image";
import {
  HERO_MARQUEE_ROTATIONS,
  HERO_MARQUEE_TRACKS,
  type HeroMarqueeProduct,
} from "@/data/heroMarqueeProducts";

const TRACK_CONFIG = [
  { direction: "up" as const, duration: "52s" },
  { direction: "down" as const, duration: "58s" },
  { direction: "up" as const, duration: "48s" },
];

function GrowthIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      viewBox="0 0 8 8"
      fill="none"
      className="hero_marquee_rev_svg"
      aria-hidden
    >
      <path
        d="M7.63109 1.69396L7.47911 3.15856C7.46152 3.31933 7.26432 3.38841 7.15126 3.27537L6.79203 2.91612L4.52982 5.17833C4.38788 5.32027 4.13792 5.32027 3.99598 5.17833L2.74995 3.9323L0.644751 6.03875C0.571896 6.1116 0.475183 6.14929 0.378462 6.14929C0.281741 6.14929 0.185028 6.1116 0.112173 6.03875C-0.0347868 5.89179 -0.0347868 5.65314 0.112173 5.50492L2.48366 3.13343C2.6256 2.99149 2.87556 2.99149 3.01624 3.13343L4.26353 4.37946L6.25946 2.38355L5.83865 1.96276C5.72436 1.84845 5.79344 1.65125 5.95422 1.63492L7.41882 1.48294C7.54065 1.46912 7.64366 1.57212 7.63109 1.69396Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MarqueeCard({
  item,
  index,
}: {
  item: HeroMarqueeProduct;
  index: number;
}) {
  const rotation = HERO_MARQUEE_ROTATIONS[index % HERO_MARQUEE_ROTATIONS.length];

  return (
    <div
      className="hero_marquee_item"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="hero_marquee_img-wrap">
        <Image
          alt={item.imageAlt}
          className="hero_marquee_img"
          height={48}
          src={item.image.split("?")[0]}
          width={48}
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
    </div>
  );
}

function MarqueeColumn({
  items,
  direction,
  duration,
  trackIndex,
}: {
  items: HeroMarqueeProduct[];
  direction: "up" | "down";
  duration: string;
  trackIndex: number;
}) {
  const loopItems = [...items, ...items];

  return (
    <div className="hero_marquee_track">
      <div className="hero_marquee_panel">
        <div
          className={`hero_marquee_list hero_marquee_list--${direction}`}
          style={{ animationDuration: duration }}
        >
          {loopItems.map((item, index) => (
            <MarqueeCard
              key={`${trackIndex}-${item.id}-${index}`}
              index={index % items.length}
              item={item}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroMarqueeSection() {
  return (
    <section
      aria-hidden
      className="hero_marquee_section"
    >
      <div className="hero_marquee_layout">
        {HERO_MARQUEE_TRACKS.map((track, trackIndex) => (
          <MarqueeColumn
            key={trackIndex}
            direction={TRACK_CONFIG[trackIndex].direction}
            duration={TRACK_CONFIG[trackIndex].duration}
            items={track}
            trackIndex={trackIndex}
          />
        ))}
      </div>
      <div className="hero_marquee_fade hero_marquee_fade--top" aria-hidden />
      <div className="hero_marquee_fade hero_marquee_fade--bottom" aria-hidden />
      <div className="hero_marquee_fade hero_marquee_fade--left" aria-hidden />
      <div className="hero_marquee_fade hero_marquee_fade--right" aria-hidden />
    </section>
  );
}
