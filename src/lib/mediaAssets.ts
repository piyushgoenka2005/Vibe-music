import { usdToInr } from "@/utils/currency";

const LOGO_PATH = "/logo.jpeg";

/** Self-hosted mirror of media.vibemusic.in assets under public/images. */
export const MEDIA_ROOT = "/images";

const REMOTE_PREFIXES: Array<[RegExp, string]> = [
  [/^https:\/\/media\.vibemusic\.in/i, "/images"],
  [/^https:\/\/assets\.vibemusic\.in/i, "/images"],
  [/^https:\/\/cdn\.vibemusic\.in/i, "/images"],
];

const SW_PRICE_PATTERN = /<sup>\$<\/sup>([\d,]+)<sup>\.(\d{2})<\/sup>/g;
const PLAIN_USD_PATTERN = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;

function formatUsdAmountAsInr(usdText: string): string {
  const usd = parseFloat(usdText.replace(/,/g, ""));
  return `₹${usdToInr(usd).toLocaleString("en-IN")}`;
}

/** Rewrite vibemusic CDN URLs to self-hosted /images paths. */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.includes("vibemusic-logo") || url.includes("sweetwater-logo")) {
    return LOGO_PATH;
  }
  if (url.startsWith("/")) return url;

  for (const [pattern, localRoot] of REMOTE_PREFIXES) {
    if (pattern.test(url)) {
      const path = url.replace(pattern, localRoot).split("?")[0];
      return path;
    }
  }

  return url;
}

/** Resolve each URL inside an img srcset attribute. */
export function resolveMediaSrcSet(srcSet: string): string {
  if (!srcSet) return srcSet;
  return srcSet
    .split(",")
    .map((part) => {
      const pieces = part.trim().split(/\s+/);
      if (!pieces[0]) return part.trim();
      pieces[0] = resolveMediaUrl(pieces[0]);
      return pieces.join(" ");
    })
    .join(", ");
}

/** Convert USD price markup in injected HTML to INR (₹). */
export function normalizeHtmlPrices(html: string): string {
  const withSupPrices = html.replace(
    SW_PRICE_PATTERN,
    (_, dollars: string, cents: string) => {
      const usd = parseFloat(`${dollars.replace(/,/g, "")}.${cents}`);
      const inr = usdToInr(usd);
      return `<sup>₹</sup>${inr.toLocaleString("en-IN")}`;
    }
  );

  return withSupPrices.replace(PLAIN_USD_PATTERN, (_, amount: string) =>
    formatUsdAmountAsInr(amount)
  );
}

/** Normalize asset URLs inside injected homepage HTML. */
export function normalizeHtmlAssets(html: string): string {
  return normalizeHtmlPrices(
    html
      .replace(
        /https:\/\/media\.vibemusic\.in\/m\/header\/logo\/vibemusic-logo__new\.svg/gi,
        LOGO_PATH
      )
      .replace(
        /\/images\/api\/i\/[^"'\s)]*vibemusic-financing-card\.png/gi,
        "/images/m/home/easy-pay.png"
      )
      .replace(
        /https:\/\/(?:media|assets|cdn)\.vibemusic\.in(\/[^"'\\s)<]+)/gi,
        (_, pathname: string) => `/images${pathname.split("?")[0]}`
      )
  );
}

export { LOGO_PATH };
