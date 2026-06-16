import { GEAR_STORIES_SECTION, GEAR_STORY_SEEDS } from "@/data/gearStories";
import { getProductImage } from "@/data/productImages";
import { getProductById } from "@/services/catalogService";
import type { CatalogProduct } from "@/types/catalog";
import type {
  GearStoriesSectionData,
  GearStory,
  GearStorySeed,
} from "@/types/gear-story";

function enrichStory(seed: GearStorySeed, product: CatalogProduct): GearStory {
  const posterUrl =
    product.image || getProductImage(product.slug, product.category);
  const images =
    product.images.length > 0 ? product.images : [posterUrl];
  const salePrice =
    product.detail?.salePrice ?? (product.price < product.originalPrice ? product.price : null);

  return {
    id: seed.id,
    title: seed.title,
    productId: product.id,
    videoUrl: seed.videoUrl,
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

export async function listGearStories(): Promise<GearStoriesSectionData> {
  const products = await Promise.all(
    GEAR_STORY_SEEDS.map((seed) => getProductById(seed.productId))
  );

  const stories: GearStory[] = [];

  GEAR_STORY_SEEDS.forEach((seed, index) => {
    const product = products[index];
    if (!product || product.status !== "active") return;
    stories.push(enrichStory(seed, product));
  });

  return {
    title: GEAR_STORIES_SECTION.title,
    subtitle: GEAR_STORIES_SECTION.subtitle,
    stories,
  };
}

/** Alias for GET /api/reels */
export const listReels = listGearStories;
