export const ROLAND_BASE = "https://static.roland.com";
export const ROLAND_GP9 = `${ROLAND_BASE}/products/gp-9/images`;
export const ROLAND_GALLERY = `${ROLAND_GP9}/gallery`;
export const ROLAND_MEDIA = `${ROLAND_BASE}/products/gp-9/media`;
export const ROLAND_LINEUP = `${ROLAND_BASE}/promos/gp_series/images`;

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
  /** Candidate CDN prefixes probed at runtime (parallax + productspinner patterns) */
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
