import { getAllProductSlugs, getCategories } from "@/services/catalogService";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic.in";

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

  const categories = await getCategories();
  const categoryRoutes = categories.map((category) => ({
    url: `${base}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const slugs = await getAllProductSlugs();
  const productRoutes = slugs.map((slug) => ({
    url: `${base}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
