import "server-only";

import { loadCategories, loadProducts } from "@/lib/server/catalogRepository";
import { categoryPath, productPath } from "@/lib/routes";
import { getCategoryGridImage } from "@/lib/categoryImages";
import type { CatalogProduct } from "@/types/catalog";
import type {
  HomepageProductItem,
  PublicHomepageData,
  ResolvedHomepageSection,
} from "@/types/homepage";

function activeProducts(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((product) => product.status === "active");
}

function toProductItem(
  product: CatalogProduct,
  rank?: number
): HomepageProductItem {
  const salePrice = product.detail?.salePrice ?? null;
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    price: product.price,
    salePrice,
    image: product.image || product.images[0] || "",
    imageAlt: product.name,
    rating: product.rating,
    reviewCount: product.reviewCount,
    href: productPath(product.slug),
    rank,
  };
}

function productSection(
  key: ResolvedHomepageSection["key"],
  sectionId: string,
  title: string,
  products: HomepageProductItem[],
  layout: ResolvedHomepageSection["layout"] = "product_carousel",
  extras?: Pick<
    ResolvedHomepageSection,
    "subtitle" | "ctaText" | "ctaLink" | "accentLabel"
  >
): ResolvedHomepageSection | null {
  if (products.length === 0) return null;
  return {
    key,
    sectionId,
    title,
    layout,
    products,
    ...extras,
  };
}

export function getHomepageStaticFallbacks(at: Date): PublicHomepageData {
  const products = activeProducts(loadProducts());
  const categories = loadCategories();

  const sections: ResolvedHomepageSection[] = [];

  const newArrivals = products
    .filter((product) => product.newArrival)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 12)
    .map((product, index) => toProductItem(product, index + 1));

  const bestSellers = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, 12)
    .map((product) => toProductItem(product));

  const trending = products
    .filter((product) => product.trending)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 12)
    .map((product) => toProductItem(product));

  const staffPicks = products
    .filter((product) => product.featured)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 12)
    .map((product) => toProductItem(product));

  const deals = products
    .filter(
      (product) =>
        product.discountPercentage > 0 ||
        (product.detail?.salePrice != null &&
          product.detail.salePrice < product.price)
    )
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .slice(0, 12)
    .map((product) =>
      toProductItem(product, undefined)
    );

  const featuredCategories = categories
    .filter((category) => category.isFeatured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 8)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      title: category.name,
      href: categoryPath(category.slug),
      imageSrc: category.imageUrl || getCategoryGridImage(category.slug),
    }));

  for (const section of [
    productSection(
      "new_arrivals",
      "top-new-products",
      "Top New Products",
      newArrivals,
      "product_grid",
      {
        accentLabel: "New arrivals",
        subtitle:
          "Fresh releases and just-landed gear from the brands you trust.",
        ctaText: "Shop All New Gear",
        ctaLink: "/search/results?q=new",
      }
    ),
    productSection("best_sellers", "best-sellers", "Best Sellers", bestSellers),
    productSection("trending", "trending-products", "Trending Now", trending),
    productSection(
      "staff_picks",
      "suggested-products",
      "Staff Picks",
      staffPicks
    ),
    productSection(
      "deals_of_the_day",
      "sales-events",
      "Deals of the Day",
      deals,
      "deals_slider"
    ),
  ]) {
    if (section) sections.push(section);
  }

  if (featuredCategories.length > 0) {
    sections.push({
      key: "featured_categories",
      sectionId: "popular-categories",
      title: "Shop by Category",
      layout: "category_grid",
      categories: featuredCategories,
    });
  }

  sections.push({
    key: "brand_strip",
    sectionId: "brand-strip",
    title: "Shop Top Brands",
    layout: "brand_strip",
    brands: [
      {
        id: "fender",
        name: "Fender",
        slug: "fender",
        href: "/search?brand=fender",
        logoUrl: "/images/big-names-deals/fender-logo.svg",
      },
      {
        id: "gibson",
        name: "Gibson",
        slug: "gibson",
        href: "/search?brand=gibson",
        logoUrl: "/images/big-names-deals/gibson-logo.svg",
      },
      {
        id: "prs",
        name: "PRS",
        slug: "prs",
        href: "/search?brand=prs",
        logoUrl: "/images/big-names-deals/prs-logo.svg",
      },
      {
        id: "ibanez",
        name: "Ibanez",
        slug: "ibanez",
        href: "/search?brand=ibanez",
        logoUrl: "/images/big-names-deals/ibanez-logo.svg",
      },
      {
        id: "epiphone",
        name: "Epiphone",
        slug: "epiphone",
        href: "/search?brand=epiphone",
        logoUrl: "/images/big-names-deals/epiphone-logo.svg",
      },
    ],
  });

  return {
    sections,
    fetchedAt: at.toISOString(),
  };
}
