import "server-only";

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  format: string;
  sizeKb: number;
  dimensions?: string;
  category: "products" | "banners" | "stories" | "brands" | "uploads";
  productSku?: string;
  createdAt: string;
}

const DEFAULT_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "med-1",
    name: "fender-stratocaster-olympic-white.webp",
    url: "/images/products/fender-player-strat.webp",
    type: "image",
    format: "webp",
    sizeKb: 142,
    dimensions: "1200x1200",
    category: "products",
    productSku: "FEN-STRAT-OW",
    createdAt: "2026-09-15T10:00:00.000Z",
  },
  {
    id: "med-2",
    name: "gibson-les-paul-heritage-cherry.webp",
    url: "/images/products/gibson-les-paul-standard.webp",
    type: "image",
    format: "webp",
    sizeKb: 168,
    dimensions: "1200x1200",
    category: "products",
    productSku: "GIB-LP-HCS",
    createdAt: "2026-09-16T11:20:00.000Z",
  },
  {
    id: "med-3",
    name: "shure-sm7b-dynamic-vocal.webp",
    url: "/images/products/shure-sm7b.webp",
    type: "image",
    format: "webp",
    sizeKb: 98,
    dimensions: "1000x1000",
    category: "products",
    productSku: "SHU-SM7B",
    createdAt: "2026-09-18T09:15:00.000Z",
  },
  {
    id: "med-4",
    name: "roland-fantom-08-synthesizer.webp",
    url: "/images/products/roland-fantom-08.webp",
    type: "image",
    format: "webp",
    sizeKb: 210,
    dimensions: "1400x1000",
    category: "products",
    productSku: "ROL-FANTOM-08",
    createdAt: "2026-09-20T14:45:00.000Z",
  },
  {
    id: "med-5",
    name: "focusrite-scarlett-2i2-4th-gen.webp",
    url: "/images/products/focusrite-scarlett-2i2.webp",
    type: "image",
    format: "webp",
    sizeKb: 112,
    dimensions: "1000x1000",
    category: "products",
    productSku: "FOC-SCARLETT-2I2",
    createdAt: "2026-09-22T16:30:00.000Z",
  },
  {
    id: "med-6",
    name: "homepage-independence-sale-banner.webp",
    url: "/images/banners/independence-sale.webp",
    type: "image",
    format: "webp",
    sizeKb: 384,
    dimensions: "1920x600",
    category: "banners",
    createdAt: "2026-10-01T08:00:00.000Z",
  },
  {
    id: "med-7",
    name: "diwali-music-gear-hero.webp",
    url: "/images/banners/festive-hero.webp",
    type: "image",
    format: "webp",
    sizeKb: 412,
    dimensions: "1920x600",
    category: "banners",
    createdAt: "2026-10-05T08:00:00.000Z",
  },
  {
    id: "med-8",
    name: "reel-1-master-strat-riff.mp4",
    url: "/videos/style-story/reel-1.mp4",
    type: "video",
    format: "mp4",
    sizeKb: 6040,
    dimensions: "1080x1920",
    category: "stories",
    createdAt: "2026-10-10T12:00:00.000Z",
  },
  {
    id: "med-9",
    name: "reel-2-analog-synth-sound-design.mp4",
    url: "/videos/style-story/reel-2.mp4",
    type: "video",
    format: "mp4",
    sizeKb: 17742,
    dimensions: "1080x1920",
    category: "stories",
    createdAt: "2026-10-11T13:30:00.000Z",
  },
  {
    id: "med-10",
    name: "reel-3-drum-groove-recording.mp4",
    url: "/videos/style-story/reel-3.mp4",
    type: "video",
    format: "mp4",
    sizeKb: 4587,
    dimensions: "1080x1920",
    category: "stories",
    createdAt: "2026-10-12T15:00:00.000Z",
  },
  {
    id: "med-11",
    name: "fender-authorized-dealer-logo.png",
    url: "/images/brands/fender.png",
    type: "image",
    format: "png",
    sizeKb: 28,
    dimensions: "400x200",
    category: "brands",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "med-12",
    name: "gibson-authorized-dealer-logo.png",
    url: "/images/brands/gibson.png",
    type: "image",
    format: "png",
    sizeKb: 32,
    dimensions: "400x200",
    category: "brands",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "med-13",
    name: "roland-pro-audio-logo.png",
    url: "/images/brands/roland.png",
    type: "image",
    format: "png",
    sizeKb: 24,
    dimensions: "400x200",
    category: "brands",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "med-14",
    name: "marshall-amplification-logo.png",
    url: "/images/brands/marshall.png",
    type: "image",
    format: "png",
    sizeKb: 36,
    dimensions: "400x200",
    category: "brands",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
];

let mediaState: MediaAsset[] = [...DEFAULT_MEDIA_ASSETS];

export async function getMediaAssets(filters?: {
  category?: string;
  search?: string;
}): Promise<MediaAsset[]> {
  let list = mediaState;

  if (filters?.category && filters.category !== "all" && filters.category !== "All") {
    list = list.filter((m) => m.category.toLowerCase() === filters.category!.toLowerCase());
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.url.toLowerCase().includes(q) ||
        m.format.toLowerCase().includes(q) ||
        (m.productSku && m.productSku.toLowerCase().includes(q)),
    );
  }

  return list;
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  const initial = mediaState.length;
  mediaState = mediaState.filter((m) => m.id !== id);
  return mediaState.length < initial;
}

export async function addUploadedMediaAsset(
  asset: Omit<MediaAsset, "id" | "createdAt">,
): Promise<MediaAsset> {
  const newAsset: MediaAsset = {
    ...asset,
    id: `med-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  mediaState.unshift(newAsset);
  return newAsset;
}
