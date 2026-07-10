import "server-only";

import { unstable_cache } from "next/cache";
import { GEAR_STORIES_SECTION, GEAR_STORY_SEEDS } from "@/data/gearStories";
import { STYLE_STORY_REELS } from "@/data/styleStory";
import { getProductImage } from "@/data/productImages";
import { isCatalogUnavailable } from "@/lib/server/firestoreCatalogRepository";
import {
  isFirestoreUnavailableError,
  logFirestoreWarning,
} from "@/lib/server/firestoreErrors";
import type { CatalogProduct } from "@/types/catalog";
import type {
  GearStoriesSectionData,
  GearStory,
  GearStorySeed,
} from "@/types/gear-story";

function enrichStory(
  seed: GearStorySeed,
  product: CatalogProduct,
  index: number
): GearStory {
  const reel = STYLE_STORY_REELS[index];
  const posterUrl =
    reel?.thumbnailSrc?.trim() ||
    product.image ||
    getProductImage(product.slug, product.category);
  const images =
    product.images.length > 0 ? product.images : [posterUrl];
  const salePrice =
    product.detail?.salePrice ??
    (product.price < product.originalPrice ? product.price : null);

  return {
    id: seed.id,
    title: seed.title,
    productId: product.id,
    videoUrl: reel?.videoSrc?.trim() ? reel.videoSrc : seed.videoUrl,
    posterUrl,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice,
    salePrice,
    discountPercentage: product.discountPercentage,
    description: seed.description || product.description,
    features: seed.features,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    rating: product.rating,
    reviewCount: product.reviewCount,
    availability: product.availability,
    image: posterUrl,
    images,
  };
}

function buildPlaceholderStory(seed: GearStorySeed, index: number): GearStory {
  const reel = STYLE_STORY_REELS[index];
  const videoUrl = reel?.videoSrc?.trim() ? reel.videoSrc : seed.videoUrl;
  const posterUrl = reel?.thumbnailSrc ?? (index % 2 === 0
    ? "/images/guitar-1.webp"
    : "/images/guitar-2.webp");

  return {
    id: seed.id,
    title: seed.title,
    productId: seed.productId,
    videoUrl,
    posterUrl,
    category: "guitars",
    price: 0,
    originalPrice: 0,
    salePrice: null,
    discountPercentage: 0,
    description: seed.description,
    features: seed.features,
    slug: seed.productId,
    brand: seed.title.split(" ")[0] ?? "Vibe Music",
    name: seed.title,
    rating: 0,
    reviewCount: 0,
    availability: "out-of-stock",
    image: posterUrl,
    images: posterUrl ? [posterUrl] : [],
  };
}

function buildStoriesFromProducts(
  products: Array<CatalogProduct | undefined>
): GearStory[] {
  return GEAR_STORY_SEEDS.map((seed, index) => {
    const product = products[index];
    if (product && product.status === "active") {
      return enrichStory(seed, product, index);
    }
    return buildPlaceholderStory(seed, index);
  });
}

async function resolveFromLocalCatalog(): Promise<Array<CatalogProduct | undefined>> {
  const { loadProducts } = await import("@/lib/server/catalogRepository");
  const local = loadProducts();
  return GEAR_STORY_SEEDS.map((seed) =>
    local.find((product) => product.id === seed.productId)
  );
}

async function resolveSeedProducts(): Promise<Array<CatalogProduct | undefined>> {
  if (isCatalogUnavailable()) {
    return resolveFromLocalCatalog();
  }

  try {
    const ids = GEAR_STORY_SEEDS.map((seed) => seed.productId);
    const { fetchProductsByIds } = await import(
      "@/lib/server/firestoreCatalogRepository"
    );
    const products = await fetchProductsByIds(ids);
    const byId = new Map(products.map((product) => [product.id, product]));
    return GEAR_STORY_SEEDS.map((seed) => byId.get(seed.productId));
  } catch (error) {
    if (!isFirestoreUnavailableError(error)) {
      throw error;
    }

    logFirestoreWarning(
      "gear-stories",
      error,
      "Firestore unavailable — using local catalog for gear stories"
    );
    return resolveFromLocalCatalog();
  }
}

export async function listGearStories(): Promise<GearStoriesSectionData> {
  const products = await resolveSeedProducts();

  return buildStaticGearStories(products);
}

const GEAR_STORIES_REVALIDATE_SECONDS = 60;

export const getCachedGearStories = unstable_cache(
  listGearStories,
  ["gear-stories-section"],
  { revalidate: GEAR_STORIES_REVALIDATE_SECONDS, tags: ["gear-stories", "catalog"] }
);

/** Always returns all reel slots — used on the homepage without Firestore. */
export async function buildStaticGearStories(
  products?: Array<CatalogProduct | undefined>
): Promise<GearStoriesSectionData> {
  const resolved = products ?? (await resolveFromLocalCatalog());
  return {
    title: GEAR_STORIES_SECTION.title,
    subtitle: GEAR_STORIES_SECTION.subtitle,
    stories: buildStoriesFromProducts(resolved),
  };
}

/** Alias for GET /api/reels */
export const listReels = listGearStories;
