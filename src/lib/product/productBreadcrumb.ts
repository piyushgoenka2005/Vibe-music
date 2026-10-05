import { categoryPath, ROUTES } from "@/lib/routes";
import { slugify, unslugify } from "@/lib/slug";
import type { Product } from "@/types/product";

export interface ProductBreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Admin uploads store free-text subcategories such as
 * "Drumsticks / Designer Drumsticks / Professional Percussion Sticks" or "GUITAR AMPLIFIER";
 * the breadcrumb shows only the leading segment in title case.
 */
export function formatSubcategoryLabel(subcategory: string): string {
  const primary = subcategory.split(/\s+[/|]\s+|\s*\|\s*/)[0]?.trim() ?? "";
  if (!primary) return "";
  const isAllCaps = /[A-Z]/.test(primary) && primary === primary.toUpperCase();
  if (!isAllCaps) return primary;
  return primary
    .toLowerCase()
    .replace(/(^|[\s\-&/(])([a-z])/g, (_, lead, char) => `${lead}${char.toUpperCase()}`);
}

export function buildProductBreadcrumb(
  product: Pick<Product, "name" | "category" | "categorySlug" | "subcategory">,
): ProductBreadcrumbItem[] {
  const items: ProductBreadcrumbItem[] = [{ label: "Home", href: ROUTES.home }];

  const categoryName = product.category?.trim() ?? "";
  const categorySlug = product.categorySlug?.trim() || slugify(categoryName);
  if (categorySlug) {
    items.push({
      label: categoryName || unslugify(categorySlug),
      href: categoryPath(categorySlug),
    });
  }

  const subcategory = product.subcategory?.trim() ?? "";
  const subcategoryLabel = formatSubcategoryLabel(subcategory);
  const subcategorySlug = slugify(subcategory);
  if (subcategoryLabel && subcategorySlug && subcategorySlug !== categorySlug) {
    items.push({
      label: subcategoryLabel,
      href: categorySlug
        ? `${categoryPath(categorySlug)}?subcat=${encodeURIComponent(subcategorySlug)}`
        : `${ROUTES.searchResults}?subcategory=${encodeURIComponent(subcategory)}`,
    });
  }

  items.push({ label: product.name });
  return items;
}
