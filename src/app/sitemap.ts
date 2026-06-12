import { BRAND } from "@/lib/brand";
import { getAllProductSlugs, getCategories } from "@/services/catalogService";

export default function sitemap() {
  const base = BRAND.siteUrl;

  const staticRoutes = [
    "",
    "/search",
    "/cart",
    "/checkout",
    "/login",
    "/register",
    "/careers",
    "/blog",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryRoutes = getCategories().map((category) => ({
    url: `${base}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productRoutes = getAllProductSlugs().map((slug) => ({
    url: `${base}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
