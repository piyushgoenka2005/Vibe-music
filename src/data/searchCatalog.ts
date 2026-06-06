import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import type { SearchBrand, SearchCategory, SearchProduct } from "@/types/search";

export const SEARCH_PRODUCTS: SearchProduct[] = PRODUCTS.map((product) => ({
  id: product.id,
  brand: product.brand,
  name: product.name,
  slug: product.slug,
  category: product.category,
  categorySlug: product.categorySlug,
  brandSlug: product.brandSlug,
  price: product.price,
  rating: product.rating,
  condition: product.condition,
  availability: product.availability,
}));

export const SEARCH_CATEGORIES: SearchCategory[] = CATEGORIES.map((category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
}));

export const SEARCH_BRANDS: SearchBrand[] = Array.from(
  new Map(PRODUCTS.map((p) => [p.brandSlug, { name: p.brand, slug: p.brandSlug }])).values()
)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((brand, index) => ({
    id: `brand-${index + 1}`,
    name: brand.name,
    slug: brand.slug,
  }));

export const RECOMMENDED_PRODUCTS = SEARCH_PRODUCTS.slice(0, 8);
