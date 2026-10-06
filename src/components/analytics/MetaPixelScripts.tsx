import {
  buildMetaPixelInlineScript,
  getMetaPixelId,
  isMetaPixelConfigured,
} from "@/lib/analytics/metaPixel";

/**
 * Meta Pixel base code in <head> on every page (Events Manager install guide).
 * Must live in root layout <head>, not <body>.
 */
export default function MetaPixelScripts() {
  if (!isMetaPixelConfigured()) return null;

  const pixelId = getMetaPixelId();
  if (!pixelId) return null;

  return (
    <>
      {/* Meta Pixel Code */}
      <script
        id="meta-pixel-base"
        dangerouslySetInnerHTML={{ __html: buildMetaPixelInlineScript(pixelId) }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {/* End Meta Pixel Code */}
    </>
  );
}
