import { HERO_MARQUEE_TRACKS } from "@/data/heroMarqueeProducts";
import DropshipHorizontalRow from "@/components/home/dropship-hero/DropshipHorizontalRow";

const ROWS = [
  { direction: "left" as const, duration: 52 },
  { direction: "right" as const, duration: 60 },
  { direction: "left" as const, duration: 48 },
] as const;

export default function DropshipHorizontalMarquee() {
  return (
    <div className="dropship-marquee-stage" aria-hidden>
      <div className="dropship-h-rows">
        {ROWS.map((row, index) => (
          <DropshipHorizontalRow
            key={index}
            products={HERO_MARQUEE_TRACKS[index] ?? HERO_MARQUEE_TRACKS[0]!}
            direction={row.direction}
            duration={row.duration}
          />
        ))}
      </div>
      <div className="dropship-marquee-edge dropship-marquee-edge--left" />
      <div className="dropship-marquee-edge dropship-marquee-edge--right" />
    </div>
  );
}
