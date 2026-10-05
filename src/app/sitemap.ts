import { getAllProductSlugs, getCategories } from "@/services/catalogService";
import { listPublicBlogSlugs } from "@/lib/server/blogService";
import { loadBrandsWithCounts } from "@/lib/server/brandsPageLoader";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic.in";

  const staticRoutes = [
    "",
    "/search",
    "/pages/careers",
    "/deals",
    "/brands",
    "/compare",
    "/gp9",
    "/gp9/showcase",
    "/used",
    "/rentals",
    "/giveaway",
    "/contact",
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

  const [categories, brands] = await Promise.all([getCategories(), loadBrandsWithCounts()]);
  const brandRoutes = brands.map((brand) => ({
    url: `${base}/brands/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

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

  return [...staticRoutes, ...brandRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
