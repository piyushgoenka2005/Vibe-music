import { GEAR_STORIES_SECTION, GEAR_STORY_SEEDS } from "@/data/gearStories";
import { getMirroredReelVideoUrl } from "@/data/reelVideos";
import { STYLE_STORY_REELS } from "@/data/styleStory";
import { getProductImage } from "@/data/productImages";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import type { CatalogProduct } from "@/types/catalog";
import type { GearStoriesSectionData, GearStory, GearStorySeed } from "@/types/gear-story";
import type { HomepageSection, HomepageSectionItem } from "@/types/homepage";

export const DEFAULT_GEAR_STORY_ITEMS: Array<{
  id: string;
  customTitle: string;
  customImage: string;
  customHref: string;
  productId: string;
  badgeLabel: string;
  offerText: string;
}> = GEAR_STORY_SEEDS.map((seed, index) => {
  const reel = STYLE_STORY_REELS[index];
  return {
    id: seed.id,
    customTitle: seed.title,
    customImage:
      reel?.thumbnailSrc ?? (index % 2 === 0 ? "/images/guitar-1.webp" : "/images/guitar-2.webp"),
    customHref: seed.videoUrl || getMirroredReelVideoUrl(index),
    productId: seed.productId,
    badgeLabel: SOCIAL_LINKS.instagramHandle,
    offerText: reel?.reelUrl ?? SOCIAL_LINKS.instagram,
  };
});

/** Admin-managed reels use only the configured URL (plus optional -opt twin for legacy paths). */
function resolveVideoCandidates(videoUrl: string): string[] {
  const trimmed = videoUrl.trim();
  if (!trimmed) return [];

  const candidates = [trimmed];
  if (
    trimmed.includes("/videos/style-story/") &&
    trimmed.endsWith(".mp4") &&
    !trimmed.includes("-opt.mp4")
  ) {
    candidates.push(trimmed.replace(/\.mp4$/i, "-opt.mp4"));
  }

  return candidates.filter((url, position, list) => url && list.indexOf(url) === position);
}

function enrichStoryFromProduct(
  base: GearStory,
  product: CatalogProduct,
  posterFallback: string,
  preservePoster = false,
): GearStory {
  const posterUrl =
    preservePoster && base.posterUrl
      ? base.posterUrl
      : product.image?.trim() ||
        base.posterUrl ||
        posterFallback ||
        getProductImage(product.slug, product.category);
  const images = product.images.length > 0 ? product.images : [posterUrl];
  const salePrice =
    product.detail?.salePrice ?? (product.price < product.originalPrice ? product.price : null);

  return {
    ...base,
    productId: product.id,
    posterUrl,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice,
    salePrice,
    discountPercentage: product.discountPercentage,
    description: base.description?.trim() ? base.description : product.description,
    features: base.features,
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

export function buildGearStoryFromSeed(
  seed: GearStorySeed,
  index: number,
  product?: CatalogProduct | null,
): GearStory {
  const reel = STYLE_STORY_REELS[index];
  const videoUrl = seed.videoUrl || getMirroredReelVideoUrl(index);
  const posterUrl =
    reel?.thumbnailSrc ?? (index % 2 === 0 ? "/images/guitar-1.webp" : "/images/guitar-2.webp");

  const base: GearStory = {
    id: seed.id,
    title: seed.title,
    productId: seed.productId,
    videoUrl,
    videoCandidates: resolveVideoCandidates(videoUrl),
    posterUrl,
    instagramHandle: SOCIAL_LINKS.instagramHandle,
    instagramUrl: reel?.reelUrl ?? SOCIAL_LINKS.instagram,
    category: "guitars",
    price: 0,
    originalPrice: 0,
    salePrice: null,
    discountPercentage: 0,
    description: seed.description,
    features: seed.features,
    slug: "",
    brand: seed.title.split(" ")[0] ?? "Vibe Music",
    name: seed.title,
    rating: 0,
    reviewCount: 0,
    availability: "out-of-stock",
    image: posterUrl,
    images: posterUrl ? [posterUrl] : [],
  };

  if (product && product.status === "active") {
    return enrichStoryFromProduct(base, product, posterUrl);
  }

  return base;
}

function parseGearStoryFeatures(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildGearStoryFromItem(
  item: HomepageSectionItem,
  _index: number,
  product?: CatalogProduct | null,
): GearStory | null {
  const videoUrl = item.customHref?.trim();
  if (!videoUrl) return null;

  const customPoster = item.customImage?.trim() || "";
  const posterUrl = customPoster || "/images/guitar-1.webp";
  const title = item.customTitle?.trim() || "Gear story";
  const description = item.categorySlug?.trim() || "";
  const features = parseGearStoryFeatures(item.brandId);

  const base: GearStory = {
    id: item.id,
    title,
    productId: item.productId ?? "",
    videoUrl,
    videoCandidates: resolveVideoCandidates(videoUrl),
    posterUrl,
    instagramHandle: item.badgeLabel?.trim() || SOCIAL_LINKS.instagramHandle,
    instagramUrl: item.offerText?.trim() || SOCIAL_LINKS.instagram,
    category: "guitars",
    price: 0,
    originalPrice: 0,
    salePrice: null,
    discountPercentage: 0,
    description,
    features,
    slug: "",
    brand: title.split(" ")[0] ?? "Vibe Music",
    name: title,
    rating: 0,
    reviewCount: 0,
    availability: "out-of-stock",
    image: posterUrl,
    images: posterUrl ? [posterUrl] : [],
  };

  if (product && product.status === "active") {
    return enrichStoryFromProduct(base, product, posterUrl, Boolean(customPoster));
  }

  return base;
}

export function buildDefaultGearStoriesSectionData(
  products?: Array<CatalogProduct | undefined>,
): GearStoriesSectionData {
  return {
    isActive: true,
    title: GEAR_STORIES_SECTION.title,
    subtitle: GEAR_STORIES_SECTION.subtitle,
    stories: GEAR_STORY_SEEDS.map((seed, index) =>
      buildGearStoryFromSeed(seed, index, products?.[index]),
    ),
  };
}

export function buildGearStoriesConfig(
  section: HomepageSection | null | undefined,
  items: HomepageSectionItem[],
  productsById: Map<string, CatalogProduct> = new Map(),
): GearStoriesSectionData {
  if (!section?.isActive) {
    return {
      isActive: false,
      title: section?.title ?? GEAR_STORIES_SECTION.title,
      subtitle: section?.subtitle ?? GEAR_STORIES_SECTION.subtitle,
      stories: [],
    };
  }

  const activeItems = items
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const stories = activeItems
    .map((item, index) =>
      buildGearStoryFromItem(item, index, item.productId ? productsById.get(item.productId) : null),
    )
    .filter((story): story is GearStory => story !== null);

  return {
    isActive: stories.length > 0,
    title: section.title?.trim() || GEAR_STORIES_SECTION.title,
    subtitle: section.subtitle?.trim() || GEAR_STORIES_SECTION.subtitle,
    stories,
  };
}
