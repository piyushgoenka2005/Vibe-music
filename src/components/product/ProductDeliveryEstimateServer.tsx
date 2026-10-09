import { formatFreeDeliveryLine, getDeliveryEstimate } from "@/lib/shipping/deliveryEstimate";

/** Crawler-visible delivery copy; client buy box uses the same calculator. */
export default function ProductDeliveryEstimateServer() {
  const line = formatFreeDeliveryLine(getDeliveryEstimate());

  return (
    <p className="visually-hidden" data-nosnippet>
      {line}
    </p>
  );
}
