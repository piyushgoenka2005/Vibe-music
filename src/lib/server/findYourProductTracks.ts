import "server-only";

import type { ScannerProduct } from "@/components/home/find-your-product/types";
import { getCachedHomepageProducts } from "@/lib/server/catalogSnapshotCache";
import { storefrontImageUrl } from "@/lib/storefrontImages";
import { formatDisplayPrice } from "@/utils/currency";

const TRACK_COUNT = 3;
const ITEMS_PER_TRACK = 9;

function deriveScannerTag(product: {
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
}): string | null {
  if (product.featured) return "Featured";
  if (product.trending) return "Trending";
  if (product.newArrival) return "New";
  return null;
}

function toScannerProduct(
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    image?: string;
    slug: string;
    featured: boolean;
    trending: boolean;
    newArrival: boolean;
  },
  index: number,
): ScannerProduct {
  const image = product.image
    ? storefrontImageUrl(product.image, 480).src
    : "/images/guitar-1.webp";

  return {
    id: product.id || `catalog-${index}`,
    name: product.name,
    price: formatDisplayPrice(product.price),
    image,
    imageAlt: product.name,
    slug: product.slug,
    tag: deriveScannerTag(product),
  };
}

/**
 * Build Find Your Product marquee tracks from the live catalog so every card
 * opens the matching PDP (name, price, image, slug aligned).
 * Returns empty tracks when the catalog is unavailable — never fabricate stats.
 */
export async function loadFindYourProductTracks(): Promise<ScannerProduct[][]> {
  try {
    const catalog = await getCachedHomepageProducts();
    const active = catalog.filter((p) => p.status === "active" && p.slug);

    if (active.length === 0) {
      return Array.from({ length: TRACK_COUNT }, () => []);
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
    return Array.from({ length: TRACK_COUNT }, () => []);
  }
}
