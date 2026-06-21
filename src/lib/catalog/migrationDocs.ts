import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { CatalogProduct } from "@/types/catalog";

/** Firestore document shape for a catalog product. */
export function productToFirestoreDoc(
  product: CatalogProduct
): Record<string, unknown> {
  return {
    ...product,
    stockQuantity: product.stock,
    images: product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : [],
  };
}

/** Firestore document shape for a category. */
export function categoryToFirestoreDoc(
  category: Category,
  index: number
): Record<string, unknown> {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    isFeatured: category.isFeatured ?? index < 8,
    sortOrder: category.sortOrder ?? index,
  };
}

/** Firestore document shape for a brand. */
export function brandToFirestoreDoc(brand: Brand): Record<string, unknown> {
  return { name: brand.name, slug: brand.slug };
}

/** Derive unique brands from product records when brands.json is empty. */
export function deriveBrandsFromProducts(
  products: CatalogProduct[]
): Brand[] {
  const map = new Map<string, Brand>();
  for (const product of products) {
    if (!map.has(product.brandSlug)) {
      map.set(product.brandSlug, {
        id: product.brandSlug,
        name: product.brand,
        slug: product.brandSlug,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
