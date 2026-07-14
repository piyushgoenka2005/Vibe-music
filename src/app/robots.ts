import { BRAND } from "@/lib/brand";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/checkout",
        "/cart",
        "/account",
        "/login",
        "/register",
      ],
    },
    sitemap: `${BRAND.siteUrl}/sitemap.xml`,
    host: BRAND.siteUrl,
  };
}
