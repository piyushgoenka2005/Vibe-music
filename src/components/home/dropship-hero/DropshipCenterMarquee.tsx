import { HERO_MARQUEE_TRACKS } from "@/data/heroMarqueeProducts";
import DropshipCenterRow, {
  type DropshipRowCurve,
} from "@/components/home/dropship-hero/DropshipCenterRow";

const ROWS: ReadonlyArray<{ duration: number; curve: DropshipRowCurve }> = [
  { duration: 52, curve: "up" },
  { duration: 58, curve: "flat" },
  { duration: 46, curve: "down" },
];

export default function DropshipCenterMarquee() {
  return (
    <div className="dropship-center-stage" aria-hidden>
      <div className="dropship-c-rows">
        {ROWS.map((row, index) => (
          <DropshipCenterRow
            key={row.curve}
            products={HERO_MARQUEE_TRACKS[index] ?? HERO_MARQUEE_TRACKS[0]!}
            duration={row.duration}
            curve={row.curve}
          />
        ))}
      </div>

      <div className="dropship-center-stage__edge-fade" aria-hidden />
    </div>
  );
}
