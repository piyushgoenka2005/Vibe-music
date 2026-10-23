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

import { isPostgresConfigured, prisma } from "@/lib/db/prisma";

let mediaState: MediaAsset[] = [...DEFAULT_MEDIA_ASSETS];
let isSeeded = false;

async function ensureDefaultMediaAssetsSeeded(): Promise<void> {
  if (isSeeded || !isPostgresConfigured()) return;
  try {
    const count = await prisma.mediaAsset.count();
    if (count === 0) {
      await prisma.mediaAsset.createMany({
        data: DEFAULT_MEDIA_ASSETS.map((m) => ({
          id: m.id,
          name: m.name,
          url: m.url,
          type: m.type,
          format: m.format,
          sizeKb: m.sizeKb,
          dimensions: m.dimensions ?? null,
          category: m.category,
          productSku: m.productSku ?? null,
          createdAt: m.createdAt,
        })),
        skipDuplicates: true,
      });
    }
    isSeeded = true;
  } catch {
    // Non-blocking fallback to in-memory defaults
  }
}

export async function getMediaAssets(filters?: {
  category?: string;
  search?: string;
}): Promise<MediaAsset[]> {
  if (isPostgresConfigured()) {
    try {
      await ensureDefaultMediaAssetsSeeded();
      const where: {
        category?: string;
        OR?: Array<{
          name?: { contains: string; mode: "insensitive" };
          url?: { contains: string; mode: "insensitive" };
          format?: { contains: string; mode: "insensitive" };
          productSku?: { contains: string; mode: "insensitive" };
        }>;
      } = {};

      if (filters?.category && filters.category !== "all" && filters.category !== "All") {
        where.category = filters.category.toLowerCase();
      }

      if (filters?.search) {
        const q = filters.search.trim();
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { url: { contains: q, mode: "insensitive" } },
          { format: { contains: q, mode: "insensitive" } },
          { productSku: { contains: q, mode: "insensitive" } },
        ];
      }

      const rows = await prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        url: r.url,
        type: r.type as "image" | "video",
        format: r.format,
        sizeKb: r.sizeKb,
        dimensions: r.dimensions ?? undefined,
        category: r.category as MediaAsset["category"],
        productSku: r.productSku ?? undefined,
        createdAt: r.createdAt,
      }));
    } catch {
      // Fallback to in-memory list on transient DB error
    }
  }

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

  if (isPostgresConfigured()) {
    try {
      await prisma.mediaAsset.delete({ where: { id } });
      return true;
    } catch {
      return mediaState.length < initial;
    }
  }

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

  if (isPostgresConfigured()) {
    try {
      await prisma.mediaAsset.create({
        data: {
          id: newAsset.id,
          name: newAsset.name,
          url: newAsset.url,
          type: newAsset.type,
          format: newAsset.format,
          sizeKb: newAsset.sizeKb,
          dimensions: newAsset.dimensions ?? null,
          category: newAsset.category,
          productSku: newAsset.productSku ?? null,
          createdAt: newAsset.createdAt,
        },
      });
    } catch {
      // In-memory fallback
    }
  }

  mediaState.unshift(newAsset);
  return newAsset;
}
