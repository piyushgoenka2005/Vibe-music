import { FIND_YOUR_PRODUCT_TRACKS } from "@/data/heroMarqueeProducts";
import ScannerRow from "@/components/home/find-your-product/ScannerRow";
import type { ScannerRowCurve } from "@/components/home/find-your-product/types";

const ROWS: ReadonlyArray<{ duration: number; curve: ScannerRowCurve }> = [
  { duration: 14, curve: "up" },
  { duration: 16, curve: "flat" },
  { duration: 18, curve: "down" },
];

export default function ScannerMarquee() {
  return (
    <div className="find-your-product__marquee">
      <div className="find-your-product__rows">
        {ROWS.map((row, index) => (
          <ScannerRow
            key={row.curve}
            products={FIND_YOUR_PRODUCT_TRACKS[index] ?? FIND_YOUR_PRODUCT_TRACKS[0]!}
            duration={row.duration}
            curve={row.curve}
          />
        ))}
      </div>
      <div className="find-your-product__edge-fade" aria-hidden />
    </div>
  );
}
