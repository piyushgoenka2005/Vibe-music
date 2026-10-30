/** Known brand logo assets keyed by catalog slug. */
const BRAND_LOGO_BY_SLUG: Record<string, string> = {
  gibson: "/images/big-names-deals/gibson-logo.svg",
  epiphone: "/images/big-names-deals/epiphone-logo.svg",
  prs: "/images/big-names-deals/prs-logo.svg",
  ibanez: "/images/big-names-deals/ibanez-logo.svg",
  fender: "/images/big-names-deals/fender-logo.svg",
  // Shop top brands strip — from Vibe images/LOGO - Copy
  hertz: "/images/brands/hertz.webp",
  avus: "/images/brands/avus.webp",
  roland: "/images/brands/roland.webp",
  zoom: "/images/brands/zoom.webp",
  gibraltar: "/images/brands/gibraltar.webp",
  adeon: "/images/brands/adeon.webp",
  zildjian: "/images/brands/zildjian.webp",
  hartke: "/images/brands/hartke.webp",
  "m-audio": "/images/brands/m-audio.webp",
  "sound-x": "/images/brands/sound-x.webp",
  trinity: "/images/brands/trinity.jpg",
};

export function getBrandLogoUrl(slug: string): string | undefined {
  return BRAND_LOGO_BY_SLUG[slug.toLowerCase()];
}
