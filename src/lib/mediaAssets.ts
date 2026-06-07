const LOGO_PATH = "/logo.jpeg";

const REMOTE_PREFIXES: Array<[RegExp, string]> = [
  [/^https:\/\/media\.vibemusic\.in/i, "/images"],
  [/^https:\/\/assets\.vibemusic\.in/i, "/images"],
  [/^https:\/\/cdn\.vibemusic\.in/i, "/images"],
];

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

/** Normalize asset URLs inside injected homepage HTML. */
export function normalizeHtmlAssets(html: string): string {
  return html
    .replace(
      /https:\/\/media\.vibemusic\.in\/m\/header\/logo\/vibemusic-logo__new\.svg/gi,
      LOGO_PATH
    )
    .replace(
      /https:\/\/(?:media|assets|cdn)\.vibemusic\.in(\/[^"'\\s)<]+)/gi,
      (_, pathname: string) => `/images${pathname.split("?")[0]}`
    );
}

export { LOGO_PATH };
