import "server-only";

import {
  fetchAllProducts,
  fetchBrands,
  fetchCategories,
} from "@/lib/server/storeCatalogRepository";
import { categoryPath, productPath } from "@/lib/routes";
import { ensureProductReviewMetrics } from "@/lib/product/productReviewDisplay";
import { getCategoryGridImage } from "@/lib/categoryImages";
import { buildTopBrandStripItems } from "@/data/topBrandStrip";
import {
  getHomepagePopularCategoryItems,
  HOMEPAGE_POPULAR_CATEGORY_COUNT,
} from "@/data/popularCategories";
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
  const originalPrice = product.originalPrice > 0 ? product.originalPrice : product.price;
  const salePrice =
    product.detail?.salePrice != null && product.detail.salePrice > 0
      ? product.detail.salePrice
      : originalPrice > product.price
        ? product.price
        : null;
  const { rating, reviewCount } = ensureProductReviewMetrics({
    id: product.id,
    rating: product.rating,
    reviewCount: product.reviewCount,
  });
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    price: salePrice != null ? originalPrice : product.price,
    salePrice,
    image: product.image || product.images[0] || "",
    imageAlt: product.name,
    rating,
    reviewCount,
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
      : [...products]
          .filter((product) => product.price > 0)
          .sort(
            (a, b) =>
              b.reviewCount - a.reviewCount ||
              b.rating - a.rating ||
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

  const staffPicksResolved =
    staffPicks.length > 0
      ? staffPicks
      : [...products]
          .filter((product) => product.price > 0)
          .sort(
            (a, b) =>
              b.reviewCount - a.reviewCount ||
              b.rating - a.rating ||
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
    .map((product) => {
      const item = toProductItem(product);
      const sale = item.salePrice;
      const pct =
        product.discountPercentage > 0
          ? product.discountPercentage
          : sale != null && sale > 0 && item.price > sale
            ? Math.round(((item.price - sale) / item.price) * 100)
            : 0;
      return {
        ...item,
        badgeLabel: pct > 0 ? `${pct}% Off` : "Hot Deal",
        offerText: pct > 0 ? `Save ${pct}%` : undefined,
      };
    });

  const dealsResolved =
    deals.length > 0
      ? deals
      : bestSellers.map((item) => ({
          ...item,
          badgeLabel: "Today's Deal",
        }));

  const featuredCategories = categories
    .filter((category) => category.isFeatured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, HOMEPAGE_POPULAR_CATEGORY_COUNT)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      title: category.name,
      href: categoryPath(category.slug),
      imageSrc: category.imageUrl || getCategoryGridImage(category.slug),
    }));

  const popularCategories =
    featuredCategories.length > 0
      ? featuredCategories
      : getHomepagePopularCategoryItems();

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
    productSection("best_sellers", "best-sellers", "Best Sellers", bestSellers, "product_carousel", {
      subtitle: "Top-rated gear musicians keep coming back for.",
      ctaText: "View all best sellers",
      ctaLink: "/search/results?q=best+sellers",
    }),
    productSection("trending", "trending-products", "Trending Now", trendingResolved, "product_carousel", {
      subtitle: "Popular right now across guitars, PA, and studio gear.",
      ctaText: "Explore trending",
      ctaLink: "/search/results?q=trending",
    }),
    productSection(
      "staff_picks",
      "suggested-products",
      "Staff Picks",
      staffPicksResolved,
      "product_carousel",
      {
        subtitle: "Hand-picked by our team for practice rooms, stages, and studios.",
        ctaText: "Shop all products",
        ctaLink: "/search",
      }
    ),
    productSection(
      "deals_of_the_day",
      "sales-events",
      "Deals Of The Day",
      dealsResolved,
      "deals_slider",
      {
        accentLabel: "Limited Time",
        ctaText: "Shop All Deals",
        ctaLink: "/deals",
      }
    ),
  ]) {
    if (section) sections.push(section);
  }

  sections.push({
    key: "featured_categories",
    sectionId: "popular-categories",
    title: "Popular Categories",
    ctaText: "Browse All Categories",
    ctaLink: "/categories",
    layout: "category_grid",
    categories: popularCategories,
  });

  sections.push({
    key: "brand_strip",
    sectionId: "brand-strip",
    title: "Shop Top Brands",
    layout: "brand_strip",
    brands: buildTopBrandStripItems(brands),
  });

  return {
    sections,
    fetchedAt: at.toISOString(),
  };
}
