import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/data/categories";
import { getAllProductSlugs } from "@/data/productDetails";
import { ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    ROUTES.home,
    ROUTES.search,
    ROUTES.cart,
    ROUTES.checkout,
    ROUTES.tracking,
    ROUTES.privacy,
    ROUTES.terms,
    ROUTES.login,
    ROUTES.register,
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
    })),
    ...CATEGORIES.map((category) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: new Date(),
    })),
    ...getAllProductSlugs().map((slug) => ({
      url: `${SITE_URL}/product/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
