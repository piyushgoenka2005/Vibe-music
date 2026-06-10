import { usdToInr } from "@/utils/currency";

const LOGO_PATH = "/logo.jpeg";

const REMOTE_PREFIXES: Array<[RegExp, string]> = [
  [/^https:\/\/media\.vibemusic\.in/i, "/images"],
  [/^https:\/\/assets\.vibemusic\.in/i, "/images"],
  [/^https:\/\/cdn\.vibemusic\.in/i, "/images"],
];

const SW_PRICE_PATTERN = /<sup>\$<\/sup>([\d,]+)<sup>\.(\d{2})<\/sup>/g;

/** Rewrite broken vibemusic CDN URLs to self-hosted /images paths. */
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

/** Convert Sweetwater-style USD price markup to INR (₹). */
export function normalizeHtmlPrices(html: string): string {
  return html.replace(SW_PRICE_PATTERN, (_, dollars: string, cents: string) => {
    const usd = parseFloat(`${dollars.replace(/,/g, "")}.${cents}`);
    const inr = usdToInr(usd);
    return `<sup>₹</sup>${inr.toLocaleString("en-IN")}`;
  });
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
        /https:\/\/(?:media|assets|cdn)\.vibemusic\.in(\/[^"'\\s)<]+)/gi,
        (_, pathname: string) => `/images${pathname.split("?")[0]}`
      )
  );
}

export { LOGO_PATH };
