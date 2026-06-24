import { getAllProductSlugs, getCategories } from "@/services/catalogService";
import { listPublicBlogSlugs } from "@/lib/server/blogService";

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
    "/deals",
  "/brands",
  "/compare",
  "/gp9",
  "/pages/shipping",
    "/pages/returns",
    "/pages/terms",
    "/pages/privacy",
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

  const blogSlugs = await listPublicBlogSlugs();
  const blogRoutes = blogSlugs.map((entry) => ({
    url: `${base}/blog/${entry.slug}`,
    lastModified: new Date(entry.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
