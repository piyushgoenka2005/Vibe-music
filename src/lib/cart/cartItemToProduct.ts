import type { CartItem } from "@/store/cartStore";
import type { Product } from "@/types/product";

/** Minimal product shape for wishlist / toast actions from a cart line. */
export function cartItemToProduct(item: CartItem): Product {
  return {
    id: item.productId,
    slug: item.slug ?? item.productId,
    name: item.name,
    brand: item.brand,
    brandSlug: item.brand.toLowerCase().replace(/\s+/g, "-"),
    category: "",
    categorySlug: "",
    price: item.price,
    originalPrice: item.originalPrice,
    rating: 0,
    reviewCount: 0,
    availability: "in-stock",
    condition: "new",
    imageColor: item.imageColor ?? "#f2f1f0",
    image: item.image ?? "",
    gstRate: item.gstRate,
  };
}
