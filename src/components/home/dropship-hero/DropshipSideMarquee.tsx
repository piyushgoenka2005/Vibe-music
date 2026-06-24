import { HERO_MARQUEE_TRACKS } from "@/data/heroMarqueeProducts";
import DropshipMarqueeColumn from "@/components/home/dropship-hero/DropshipMarqueeColumn";

export default function DropshipSideMarquee() {
  const leftTrack = HERO_MARQUEE_TRACKS[0] ?? [];
  const rightTrack = HERO_MARQUEE_TRACKS[1] ?? leftTrack;

  return (
    <div className="dropship-side-stage" aria-hidden>
      <DropshipMarqueeColumn
        products={leftTrack}
        direction="left"
        columnId="dropship-marquee-left"
      />
      <DropshipMarqueeColumn
        products={rightTrack}
        direction="right"
        columnId="dropship-marquee-right"
      />
      <div className="dropship-side-stage__left-wash" />
      <div className="dropship-side-stage__center-mask" />
    </div>
  );
}
