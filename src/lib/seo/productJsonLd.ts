import { BRAND } from "@/lib/brand";
import { storefrontImageUrl } from "@/lib/storefrontImages";
import type { ProductDetail } from "@/types/product";

function availabilitySchema(
  availability: ProductDetail["availability"]
): string {
  switch (availability) {
    case "out-of-stock":
      return "https://schema.org/OutOfStock";
    case "limited":
      return "https://schema.org/LimitedAvailability";
    default:
      return "https://schema.org/InStock";
  }
}

function conditionSchema(condition: ProductDetail["condition"]): string {
  switch (condition) {
    case "used":
      return "https://schema.org/UsedCondition";
    case "open-box":
      return "https://schema.org/RefurbishedCondition";
    default:
      return "https://schema.org/NewCondition";
  }
}

/** Google Product / Offer JSON-LD for PDP SEO. */
export function buildProductJsonLd(product: ProductDetail): Record<string, unknown> {
  const hero = product.images?.[0]?.src || product.image;
  const image = hero ? storefrontImageUrl(hero, 1200).src : undefined;
  const url = `${BRAND.siteUrl}/product/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.slice(0, 5000) || product.name,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category,
    image: image ? [image] : undefined,
    url,
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating.toFixed(1)),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: product.price,
      availability: availabilitySchema(product.availability),
      itemCondition: conditionSchema(product.condition),
      seller: {
        "@type": "Organization",
        name: BRAND.name,
        url: BRAND.siteUrl,
      },
    },
  };
}
