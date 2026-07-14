import "server-only";

import { getProductDetailBySlug } from "@/services/catalogService";

export async function fetchProductDetailServer(slug: string) {
  const product = await getProductDetailBySlug(slug);
  if (!product) return null;
  return {
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      imageColor: product.imageColor,
      availability: product.availability,
      rating: product.rating,
      reviewCount: product.reviewCount,
      condition: product.condition,
      specs: product.specs ?? [],
    },
  };
}
