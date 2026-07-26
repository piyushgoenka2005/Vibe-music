import { loadFindYourProductTracks } from "@/lib/server/findYourProductTracks";
import ScannerRow from "@/components/home/find-your-product/ScannerRow";
import type { ScannerRowCurve } from "@/components/home/find-your-product/types";

const ROWS: ReadonlyArray<{ duration: number; curve: ScannerRowCurve }> = [
  { duration: 14, curve: "up" },
  { duration: 16, curve: "flat" },
  { duration: 18, curve: "down" },
];

export default async function ScannerMarquee() {
  const tracks = await loadFindYourProductTracks();

  return (
    <div className="find-your-product__marquee">
      <div className="find-your-product__rows">
        {ROWS.map((row, index) => (
          <ScannerRow
            key={row.curve}
            products={tracks[index] ?? tracks[0] ?? []}
            duration={row.duration}
            curve={row.curve}
          />
        ))}
      </div>
      <div className="find-your-product__edge-fade" aria-hidden />
    </div>
  );
}
