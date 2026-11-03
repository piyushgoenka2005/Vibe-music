/**
 * Storefront image specifications.
 *
 * Every admin image slot should use the spec for the storefront component that renders it.
 * The ratio and pixel guidance here is derived from the actual CSS frames, so an image that
 * matches a spec will not be cropped or stretched on the live site.
 */

export type ImageFit = "cover" | "contain";

export interface ImageSpec {
  /** Stable identifier used in admin copy and analytics-free debugging. */
  id: string;
  /** Human readable slot name. */
  label: string;
  /** CSS `aspect-ratio` value. */
  aspectRatio: string;
  /** Friendly ratio label, e.g. "1:1 (square)". */
  ratioLabel: string;
  /** Recommended upload width in pixels. */
  recommendedWidth: number;
  /** Recommended upload height in pixels. */
  recommendedHeight: number;
  /** Hard client-side upload limit in megabytes (the API limit is 10 MB). */
  maxUploadMb: number;
  /** How the storefront crops the image. */
  fit: ImageFit;
  /** Why this ratio/size matters and any safe-area guidance. */
  hint: string;
  /** Upload endpoint used by the admin uploader. */
  endpoint: string;
  /** Preview container max width in the admin panel. */
  previewMaxWidth?: number;
  /** Preview background so transparent cut-outs are visible. */
  previewBackground?: string;
}

const BANNER_ENDPOINT = "/api/admin/upload/banner-image";

function spec(input: Omit<ImageSpec, "endpoint" | "maxUploadMb"> & Partial<ImageSpec>): ImageSpec {
  return {
    endpoint: BANNER_ENDPOINT,
    maxUploadMb: 10,
    ...input,
  };
}

export const IMAGE_SPECS = {
  /**
   * `category.imageUrl` is the first featured card in the header mega-menu. The card is a
   * near-square tile (2-up grid, 220px min-height), so square art with a centred subject is
   * the only safe choice. The card label overlays the bottom of the image.
   */
  categoryStorefront: spec({
    id: "category-storefront",
    label: "Category storefront image",
    aspectRatio: "1 / 1",
    ratioLabel: "1:1 (square)",
    recommendedWidth: 1000,
    recommendedHeight: 1000,
    fit: "cover",
    hint: "Used as featured card 1 in the header mega-menu. Keep the product centred and the bottom ~25% clear — the category label sits over it.",
    previewMaxWidth: 320,
  }),

  /** `category.featuredImageUrls[i]` — the two mega-menu featured cards. */
  categoryFeaturedCard: spec({
    id: "category-featured-card",
    label: "Mega-menu featured promo card",
    aspectRatio: "4 / 5",
    ratioLabel: "4:5 (portrait card)",
    recommendedWidth: 800,
    recommendedHeight: 1000,
    fit: "cover",
    hint: "Rendered in the header mega-menu 2-card promo panel (recommended: 800×1000px, 4:5 portrait ratio). Keep subject centred with bottom 20% clear for the title overlay.",
    previewMaxWidth: 260,
  }),

  /** Homepage banner hero desktop frame — 1920×720 (8:3). */
  heroDesktop: spec({
    id: "home-hero-desktop",
    label: "Desktop hero banner",
    aspectRatio: "1920 / 720",
    ratioLabel: "8:3 (ultra-wide)",
    recommendedWidth: 1920,
    recommendedHeight: 720,
    fit: "cover",
    hint: "The hero frame is 1920×720. Place text/CTA inside the centre 80% so it survives the mobile contain-fit and tablet crop.",
    previewMaxWidth: 480,
  }),

  /** Mobile-specific hero creative. The mobile frame keeps the same 8:3 window. */
  heroMobile: spec({
    id: "home-hero-mobile",
    label: "Mobile hero banner",
    aspectRatio: "1920 / 720",
    ratioLabel: "8:3 (wide, same frame)",
    recommendedWidth: 1080,
    recommendedHeight: 405,
    fit: "cover",
    hint: "Phones keep the 8:3 hero frame with contain-fit, so use the same wide ratio with larger text. A portrait image will letterbox.",
    previewMaxWidth: 480,
  }),

  /** Full-width A+ story banner. Natural height, standardised at 16:5. */
  storyBanner: spec({
    id: "home-story-banner",
    label: "Story banner",
    aspectRatio: "16 / 5",
    ratioLabel: "16:5 (wide)",
    recommendedWidth: 1920,
    recommendedHeight: 600,
    fit: "cover",
    hint: "Full-bleed A+ story banner. Keep headline text well inside the edges; the image scales to the viewport width.",
    previewMaxWidth: 520,
  }),

  /** Gear reels vertical poster. */
  reelPoster: spec({
    id: "home-reel-poster",
    label: "Reel poster",
    aspectRatio: "9 / 16",
    ratioLabel: "9:16 (portrait)",
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    fit: "cover",
    hint: "Vertical reel card poster. Use a 9:16 frame that matches the MP4 so the video does not jump when playback starts.",
    previewMaxWidth: 220,
  }),

  /** Editorial split visual card — square frame with contain-fit. */
  editorialVisual: spec({
    id: "home-editorial-visual",
    label: "Editorial visual card",
    aspectRatio: "1 / 1",
    ratioLabel: "1:1 (square)",
    recommendedWidth: 1600,
    recommendedHeight: 1600,
    fit: "contain",
    hint: "Rendered with object-fit: contain inside a square card on a light panel. Use a transparent PNG/WebP cut-out with the subject centred.",
    previewMaxWidth: 320,
    previewBackground: "#f1f5f9",
  }),

  /** Homepage Featured Categories tile — square, contain-fit. */
  featuredCategoryTile: spec({
    id: "home-featured-category",
    label: "Featured category tile",
    aspectRatio: "1 / 1",
    ratioLabel: "1:1 (square)",
    recommendedWidth: 1200,
    recommendedHeight: 1200,
    fit: "contain",
    hint: "Rendered on a light square card with object-fit: contain. Use a transparent product cut-out so the pale card background shows through.",
    previewMaxWidth: 320,
    previewBackground: "#f1f5f9",
  }),

  /** Browse By Categories card — 4:3 cover. */
  browseCategoryCard: spec({
    id: "home-browse-category",
    label: "Browse category card",
    aspectRatio: "4 / 3",
    ratioLabel: "4:3 (landscape)",
    recommendedWidth: 1600,
    recommendedHeight: 1200,
    fit: "cover",
    hint: "Card art is cropped to 4:3 with a dark gradient at the bottom for the title. Keep the subject above the lower third.",
    previewMaxWidth: 400,
  }),

  /** Category Bento card — mixed variants, 4:3 is the safest shared ratio. */
  bentoCategoryCard: spec({
    id: "home-bento-category",
    label: "Bento category card",
    aspectRatio: "4 / 3",
    ratioLabel: "4:3 (landscape)",
    recommendedWidth: 1600,
    recommendedHeight: 1200,
    fit: "contain",
    hint: "Bento variants crop some cards and contain others. A 4:3 image with a centred subject survives both. Transparent cut-outs look best.",
    previewMaxWidth: 400,
    previewBackground: "#f1f5f9",
  }),

  /** Brand strip / brand mega-menu logo. */
  brandLogo: spec({
    id: "brand-logo",
    label: "Brand logo",
    aspectRatio: "2 / 1",
    ratioLabel: "2:1 (landscape logo)",
    recommendedWidth: 600,
    recommendedHeight: 300,
    fit: "contain",
    hint: "Shown inside a 260×140 white logo card with object-fit: contain. Use a transparent PNG/WebP on a light background; keep padding around the wordmark.",
    previewMaxWidth: 260,
    previewBackground: "#ffffff",
  }),

  /** Homepage Shop the Highlights card. */
  highlightCard: spec({
    id: "home-highlight-card",
    label: "Highlight card image",
    aspectRatio: "1 / 1",
    ratioLabel: "1:1 (square)",
    recommendedWidth: 1200,
    recommendedHeight: 1200,
    fit: "cover",
    hint: "Highlight cards are square and crop with object-fit: cover. Keep the product centred; the badge/title sit outside the image.",
    previewMaxWidth: 320,
  }),

  /** Blog listing + article cover. */
  blogCover: spec({
    id: "blog-cover",
    label: "Blog cover",
    aspectRatio: "16 / 9",
    ratioLabel: "16:9 (landscape)",
    recommendedWidth: 1600,
    recommendedHeight: 900,
    fit: "cover",
    hint: "Used by the blog listing cards (16:10 crop) and the article hero (max-height 420px). 16:9 at 1600×900 is the safe master.",
    previewMaxWidth: 420,
    endpoint: "/api/admin/upload/blog-image",
  }),

  /** Product gallery / 360 / card imagery. */
  productImage: spec({
    id: "product-image",
    label: "Product image",
    aspectRatio: "1 / 1",
    ratioLabel: "1:1 (square)",
    recommendedWidth: 1600,
    recommendedHeight: 1600,
    fit: "cover",
    hint: "Product cards and the PDP gallery use a square frame. Shoot on white or transparent and keep the product centred with even padding.",
    previewMaxWidth: 320,
    previewBackground: "#ffffff",
  }),

  /** Rental product card — 4:3. */
  rentalProduct: spec({
    id: "rental-product",
    label: "Rental product image",
    aspectRatio: "4 / 3",
    ratioLabel: "4:3 (landscape)",
    recommendedWidth: 1600,
    recommendedHeight: 1200,
    fit: "cover",
    hint: "Rental listing cards crop to 4:3. Keep the whole item in frame with a little space around it.",
    previewMaxWidth: 400,
  }),

  /** Giveaway prize card. */
  giveawayPrize: spec({
    id: "giveaway-prize",
    label: "Giveaway prize image",
    aspectRatio: "4 / 3",
    ratioLabel: "4:3 (landscape)",
    recommendedWidth: 1200,
    recommendedHeight: 900,
    fit: "cover",
    hint: "Prize cards are capped at 220px tall and crop to the card width. 4:3 keeps the prize readable on desktop and mobile.",
    previewMaxWidth: 400,
  }),

  /** Header wordmark. Rendered at max 240×58 with contain-fit. */
  headerLogo: spec({
    id: "header-logo",
    label: "Header logo",
    aspectRatio: "5 / 1",
    ratioLabel: "5:1 (wordmark)",
    recommendedWidth: 480,
    recommendedHeight: 96,
    fit: "contain",
    hint: "The header renders the logo up to 240×58 with object-fit: contain. Use a transparent PNG/WebP at 2× (480×96) to stay sharp on retina screens.",
    previewMaxWidth: 300,
    previewBackground: "#ffffff",
  }),

  /** Generic fallback for ad-hoc media registration. */
  generic: spec({
    id: "generic-image",
    label: "Image",
    aspectRatio: "16 / 9",
    ratioLabel: "Any ratio",
    recommendedWidth: 1600,
    recommendedHeight: 900,
    fit: "cover",
    hint: "Upload the highest-quality JPG, PNG or WebP you have (up to 10 MB). The CDN generates responsive sizes automatically.",
    previewMaxWidth: 420,
  }),
} as const satisfies Record<string, ImageSpec>;

export type ImageSpecKey = keyof typeof IMAGE_SPECS;

/** Parse a CSS aspect-ratio string into a single number. */
export function imageSpecRatio(aspectRatio: string): number {
  const [width, height] = aspectRatio.split("/").map((part) => Number(part.trim()));
  if (!width || !height) return 1;
  return width / height;
}

export function isNearImageSpecRatio(
  naturalWidth: number,
  naturalHeight: number,
  spec: ImageSpec,
  tolerance = 0.08,
): boolean {
  if (!naturalWidth || !naturalHeight) return true;
  const expected = imageSpecRatio(spec.aspectRatio);
  const actual = naturalWidth / naturalHeight;
  return Math.abs(actual / expected - 1) <= tolerance;
}
