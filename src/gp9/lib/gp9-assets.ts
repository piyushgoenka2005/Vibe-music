/**
 * GP-9 marketing assets — self-hosted under /gp9-assets (npm run download:gp9-assets).
 * Roland CDN is only used as the download source, not at runtime.
 */
export const GP9_STATIC_BASE = "/gp9-assets";

export const ROLAND_GP9 = `${GP9_STATIC_BASE}/images`;
export const ROLAND_GALLERY = `${ROLAND_GP9}/gallery`;
export const ROLAND_MEDIA = `${GP9_STATIC_BASE}/media`;
export const ROLAND_LINEUP = `${GP9_STATIC_BASE}/promos`;
export const GP9_HDRI_BASE = `${GP9_STATIC_BASE}/hdri`;

/** Sound Lab / interactive section hero still */
export const GP9_INTERACTIVE_IMAGE = `${ROLAND_GP9}/gp-9_interactive.jpg`;

export const GP9_VIDEOS = {
  hero: `${ROLAND_MEDIA}/gp-9_hero.mp4`,
  openLid: `${ROLAND_MEDIA}/gp_series_open_lid.mp4`,
  speakers: `${ROLAND_MEDIA}/gp_series_speakers.mp4`,
  movingKeys: `${ROLAND_MEDIA}/gp_series_moving_keys.mp4`,
} as const;

export const FINISHES = {
  ebony: {
    label: "Polished Ebony",
    shortLabel: "Ebony",
    picker: `${ROLAND_GP9}/gp_color_picker_bk.jpg`,
    galleryPrefix: "gp-9",
  },
  white: {
    label: "Polished White",
    shortLabel: "White",
    picker: `${ROLAND_GP9}/gp_color_picker_wh.jpg`,
    galleryPrefix: "gp-9-pw",
  },
} as const;

export type FinishKey = keyof typeof FINISHES;

export function galleryImage(finish: FinishKey, name: string) {
  const prefix = FINISHES[finish].galleryPrefix;
  return `${ROLAND_GALLERY}/${prefix}_${name}`;
}

/** Roland rc_productspinner / parallax-spinner frame conventions */
export const GP9_SPINNER = {
  /** Self-hosted spin frames are optional; gallery fallback is always local */
  candidatePrefixes: [
    `${ROLAND_GP9}/spin/gp-9_spin_`,
    `${ROLAND_GP9}/spin/gp-9_`,
    `${ROLAND_GP9}/gp-9_spin_`,
    `${ROLAND_GP9}/gp-9_`,
  ],
  /** productspinner: 1000 + index*step, count derived from length */
  productSpinner: { length: 185, step: 2, startPad: 1000 },
  /** parallax-spinner (gp-9.js): path + _0000.jpg, i += 2, max 181 */
  parallax: { maxIndex: 181, step: 2, padStart: 10000, extension: "jpg" },
  fixFrames: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1] as const,
} as const;

export const GALLERY_SPINNER_FALLBACK = [
  `${ROLAND_GALLERY}/gp-9_angle_open_gal.jpg`,
  `${ROLAND_GALLERY}/gp-9_angle_side_gal.jpg`,
  `${ROLAND_GALLERY}/gp-9_front_gal.jpg`,
  `${ROLAND_GALLERY}/gp-9_top_angle_gal.jpg`,
  `${ROLAND_GALLERY}/gp-9_back_angle_gal.jpg`,
  `${ROLAND_GALLERY}/gp-9_angle_closed_gal.jpg`,
  `${ROLAND_GALLERY}/gp-9_side_gal.jpg`,
  `${ROLAND_GALLERY}/gp-9_top_angle_gal.jpg`,
] as const;

/** Absolute URL for JSON-LD / Open Graph */
export function gp9PublicAssetUrl(
  relativePath: string,
  siteOrigin = "https://vibemusic.in",
): string {
  const normalized = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${siteOrigin.replace(/\/$/, "")}${normalized}`;
}
