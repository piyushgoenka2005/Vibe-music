/**
 * GP-9 assets mirrored into public/gp9-assets on deploy (npm run download:gp9-assets).
 * Source: Roland CDN + Poly Haven HDRIs (same slugs as drei Environment presets).
 */
export const GP9_PUBLIC_ROOT = "gp9-assets";

const ROLAND = "https://static.roland.com";

/** @type {{ url: string, dest: string }[]} */
export const GP9_ASSET_DOWNLOADS = [
  // Hero + editorial
  { url: `${ROLAND}/products/gp-9/images/gp-9_hero.jpg`, dest: "images/gp-9_hero.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gp-9_elegance.jpg`, dest: "images/gp-9_elegance.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gp-9_elegance2.jpg`, dest: "images/gp-9_elegance2.jpg" },
  {
    url: `${ROLAND}/products/gp-9/images/gp_series_modern_elegance.jpg`,
    dest: "images/gp_series_modern_elegance.jpg",
  },
  {
    url: `${ROLAND}/products/gp-9/images/gp_series_immersive_sound.jpg`,
    dest: "images/gp_series_immersive_sound.jpg",
  },
  { url: `${ROLAND}/products/gp-9/images/gp_color_picker_bk.jpg`, dest: "images/gp_color_picker_bk.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gp_color_picker_wh.jpg`, dest: "images/gp_color_picker_wh.jpg" },
  ...Array.from({ length: 7 }, (_, i) => ({
    url: `${ROLAND}/products/gp-9/images/gp-9_more_info_${i + 1}.jpg`,
    dest: `images/gp-9_more_info_${i + 1}.jpg`,
  })),
  // Gallery — ebony
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_angle_open_gal.jpg`, dest: "images/gallery/gp-9_angle_open_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_angle_closed_gal.jpg`, dest: "images/gallery/gp-9_angle_closed_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_angle_side_gal.jpg`, dest: "images/gallery/gp-9_angle_side_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_top_angle_gal.jpg`, dest: "images/gallery/gp-9_top_angle_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_back_angle_gal.jpg`, dest: "images/gallery/gp-9_back_angle_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_front_gal.jpg`, dest: "images/gallery/gp-9_front_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_side_gal.jpg`, dest: "images/gallery/gp-9_side_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_panel_1_gal.jpg`, dest: "images/gallery/gp-9_panel_1_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_ipad_1_gal.jpg`, dest: "images/gallery/gp-9_ipad_1_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_casters_gal.jpg`, dest: "images/gallery/gp-9_casters_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_pedals_gal.jpg`, dest: "images/gallery/gp-9_pedals_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_speakers_gal.jpg`, dest: "images/gallery/gp-9_speakers_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9_jacks_gal.jpg`, dest: "images/gallery/gp-9_jacks_gal.jpg" },
  // Gallery — polished white
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9-pw_angle_open_gal.jpg`, dest: "images/gallery/gp-9-pw_angle_open_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9-pw_angle_closed_gal.jpg`, dest: "images/gallery/gp-9-pw_angle_closed_gal.jpg" },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9-pw_angle_side_gal.jpg`, dest: "images/gallery/gp-9-pw_angle_side_gal.jpg" },
  {
    url: `${ROLAND}/products/gp-9/images/gallery/gp-9-pw_top_angle_gal.jpg`,
    dest: "images/gallery/gp-9-pw_top_angle_gal.jpg",
    fallback: "images/gallery/gp-9_top_angle_gal.jpg",
  },
  { url: `${ROLAND}/products/gp-9/images/gallery/gp-9-pw_back_angle_gal.jpg`, dest: "images/gallery/gp-9-pw_back_angle_gal.jpg" },
  // Lineup promos
  { url: `${ROLAND}/promos/gp_series/images/gp_series_gp-3_lineup.jpg`, dest: "promos/gp_series_gp-3_lineup.jpg" },
  { url: `${ROLAND}/promos/gp_series/images/gp_series_gp-6_lineup.jpg`, dest: "promos/gp_series_gp-6_lineup.jpg" },
  { url: `${ROLAND}/promos/gp_series/images/gp_series_gp-9m_lineup.jpg`, dest: "promos/gp_series_gp-9m_lineup.jpg" },
  // Video + posters
  { url: `${ROLAND}/products/gp-9/media/gp-9_hero.mp4`, dest: "media/gp-9_hero.mp4" },
  { url: `${ROLAND}/products/gp-9/media/gp_series_open_lid.mp4`, dest: "media/gp_series_open_lid.mp4" },
  { url: `${ROLAND}/products/gp-9/media/gp_series_speakers.mp4`, dest: "media/gp_series_speakers.mp4" },
  { url: `${ROLAND}/products/gp-9/media/gp_series_moving_keys.mp4`, dest: "media/gp_series_moving_keys.mp4" },
  // 3D showroom HDRIs (Poly Haven 1k)
  {
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr",
    dest: "hdri/potsdamer_platz_1k.hdr",
  },
  {
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr",
    dest: "hdri/empty_warehouse_01_1k.hdr",
  },
  {
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr",
    dest: "hdri/venice_sunset_1k.hdr",
  },
  {
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dikhololo_night_1k.hdr",
    dest: "hdri/dikhololo_night_1k.hdr",
  },
  {
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/lebombo_1k.hdr",
    dest: "hdri/lebombo_1k.hdr",
  },
];

/** Minimum files required for verify:gp9-assets */
export const GP9_REQUIRED_FILES = [
  "images/gp-9_hero.jpg",
  "images/gallery/gp-9_angle_open_gal.jpg",
  "images/gp-9_more_info_1.jpg",
  "media/gp-9_hero.mp4",
  "hdri/potsdamer_platz_1k.hdr",
  "promos/gp_series_gp-9m_lineup.jpg",
];
