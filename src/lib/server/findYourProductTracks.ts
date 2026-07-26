import "server-only";

import { FIND_YOUR_PRODUCT_TRACKS } from "@/data/heroMarqueeProducts";
import type { ScannerProduct } from "@/components/home/find-your-product/types";
import { fetchAllProducts } from "@/lib/server/storeCatalogRepository";
import { formatDisplayPrice } from "@/utils/currency";

const TRACK_COUNT = 3;
const ITEMS_PER_TRACK = 9;

function toScannerProduct(
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    image?: string;
    slug: string;
  },
  index: number
): ScannerProduct {
  return {
    id: product.id || `catalog-${index}`,
    name: product.name,
    price: formatDisplayPrice(product.price),
    revenue: product.brand,
    growth: product.category,
    image: product.image || "/images/guitar-1.webp",
    imageAlt: `${product.brand} ${product.name}`,
    slug: product.slug,
  };
}

/**
 * Build Find Your Product marquee tracks from the live catalog so every card
 * opens the matching PDP (name, price, image, slug aligned).
 * Falls back to static tracks when the catalog is empty.
 */
export async function loadFindYourProductTracks(): Promise<ScannerProduct[][]> {
  try {
    const catalog = await fetchAllProducts(false);
    const active = catalog.filter((p) => p.status === "active" && p.slug);

    if (active.length === 0) {
      return FIND_YOUR_PRODUCT_TRACKS.map((track) =>
        track.slice(0, ITEMS_PER_TRACK)
      );
    }

    const ranked = [...active].sort((a, b) => {
      const score = (p: (typeof active)[number]) =>
        (p.featured ? 4 : 0) +
        (p.trending ? 2 : 0) +
        (p.newArrival ? 1 : 0) +
        (p.reviewCount > 0 ? 1 : 0);
      return score(b) - score(a) || a.name.localeCompare(b.name);
    });

    const needed = TRACK_COUNT * ITEMS_PER_TRACK;
    const pool: typeof ranked = [];
    while (pool.length < needed) {
      pool.push(...ranked);
      if (ranked.length === 0) break;
    }

    const tracks: ScannerProduct[][] = [];
    for (let t = 0; t < TRACK_COUNT; t += 1) {
      const slice = pool.slice(t * ITEMS_PER_TRACK, (t + 1) * ITEMS_PER_TRACK);
      tracks.push(slice.map((product, i) => toScannerProduct(product, t * ITEMS_PER_TRACK + i)));
    }
    return tracks;
  } catch {
    return FIND_YOUR_PRODUCT_TRACKS.map((track) =>
      track.slice(0, ITEMS_PER_TRACK)
    );
  }
}
