import { usdToInr } from "@/utils/currency";

/** Legacy `<sup>₹</sup>` price markup (matches HtmlChunk price normalization). */
export function LegacySupPrice({ usd }: { usd: number }) {
  const inr = usdToInr(usd);
  return (
    <>
      <sup>₹</sup>
      {inr.toLocaleString("en-IN")}
    </>
  );
}
