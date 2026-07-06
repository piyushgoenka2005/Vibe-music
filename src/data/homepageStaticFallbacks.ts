import "server-only";

import {
  fetchAllProducts,
  fetchBrands,
  fetchCategories,
} from "@/lib/server/firestoreCatalogRepository";
import { categoryPath, productPath } from "@/lib/routes";
import { getCategoryGridImage } from "@/lib/categoryImages";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import type { CatalogProduct } from "@/types/catalog";
import type {
  HomepageProductItem,
  PublicHomepageData,
  ResolvedHomepageSection,
} from "@/types/homepage";
import { hasPositiveDisplayPrice } from "@/lib/homepage/productVisibility";

function activeProducts(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter(
    (product) => product.status === "active" && hasPositiveDisplayPrice(product)
  );
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

export async function getHomepageStaticFallbacks(
  at: Date
): Promise<PublicHomepageData> {
  const [allProducts, categories, brands] = await Promise.all([
    fetchAllProducts(),
    fetchCategories(),
    fetchBrands(),
  ]);
  const products = activeProducts(allProducts);

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

  const trendingResolved =
    trending.length > 0
      ? trending
      : products
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

  const staffPicksResolved =
    staffPicks.length > 0
      ? staffPicks
      : products
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
    .map((product) => toProductItem(product));

  const dealsResolved = deals.length > 0 ? deals : bestSellers;

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
    productSection("trending", "trending-products", "Trending Now", trendingResolved),
    productSection(
      "staff_picks",
      "suggested-products",
      "Staff Picks",
      staffPicksResolved
    ),
    productSection(
      "deals_of_the_day",
      "sales-events",
      "Deals of the Day",
      dealsResolved,
      "deals_slider"
    ),
  ]) {
    if (section) sections.push(section);
  }

  if (featuredCategories.length > 0) {
    sections.push({
      key: "featured_categories",
      sectionId: "popular-categories",
      title: "Find Your Product",
      subtitle:
        "Curated departments for every stage — from bedroom studio to main stage.",
      layout: "category_grid",
      categories: featuredCategories,
    });
  }

  sections.push({
    key: "brand_strip",
    sectionId: "brand-strip",
    title: "Shop Top Brands",
    layout: "brand_strip",
    brands: brands
      .filter((brand) => brand.slug !== "roland")
      .slice(0, 8)
      .map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      href: `/search?brand=${encodeURIComponent(brand.slug)}`,
      logoUrl: getBrandLogoUrl(brand.slug),
    })),
  });

  return {
    sections,
    fetchedAt: at.toISOString(),
  };
}
