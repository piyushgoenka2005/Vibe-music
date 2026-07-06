import { HERO_MARQUEE_TRACKS } from "@/data/heroMarqueeProducts";
import DropshipMarqueeColumn from "@/components/home/dropship-hero/DropshipMarqueeColumn";
import DropshipCenterRow from "@/components/home/dropship-hero/DropshipCenterRow";

const DISPATCH_ROWS = [
  { duration: 18, curve: "up" as const },
  { duration: 20, curve: "flat" as const },
  { duration: 16, curve: "down" as const },
] as const;

export default function DropshipSpineMarquee() {
  const leftTrack = HERO_MARQUEE_TRACKS[0] ?? [];
  const rightTrack = HERO_MARQUEE_TRACKS[1] ?? leftTrack;

  return (
    <div className="dropship-spine-stage" aria-hidden>
      <DropshipMarqueeColumn
        products={leftTrack}
        direction="left"
        columnId="dropship-spine-left"
      />
      <DropshipMarqueeColumn
        products={rightTrack}
        direction="right"
        columnId="dropship-spine-right"
      />

      <div className="dropship-dispatch-rows">
        {DISPATCH_ROWS.map((row, index) => (
          <DropshipCenterRow
            key={index}
            products={HERO_MARQUEE_TRACKS[index] ?? HERO_MARQUEE_TRACKS[0]!}
            duration={row.duration}
            curve={row.curve}
          />
        ))}
      </div>

      <div className="dropship-spine-stage__blur dropship-spine-stage__blur--left" />
      <div className="dropship-spine-stage__blur dropship-spine-stage__blur--right" />
    </div>
  );
}
