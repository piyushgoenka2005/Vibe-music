import type { NextConfig } from "next";
import { API_SECURITY_HEADERS, SECURITY_HEADERS } from "@/lib/security/headers";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    // CDN PNG masters often exceed the default 7s optimizer fetch window in local/dev.
    imgOptTimeoutInSeconds: 30,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "recharts",
      "framer-motion",
      "@tanstack/react-query",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "gsap",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.vibemusic.in" },
      { protocol: "https", hostname: "static.roland.com", pathname: "/**" },
      { protocol: "https", hostname: "framerusercontent.com", pathname: "/**" },
    ],
    // Next 16 requires explicit allowlists for local optimizer sources.
    // - /api/media/thumb takes ?url=&w= queries (host/width validated in-route)
    // - every other local asset must be query-free
    localPatterns: [
      { pathname: "/api/media/thumb" },
      { pathname: "/**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...SECURITY_HEADERS],
      },
      {
        source: "/(favicon.ico|icon-48.png|icon-192.png|icon-512.png|apple-icon.png|site.webmanifest)",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [...API_SECURITY_HEADERS],
      },
      // Thumb proxy must be cacheable — override API no-store (last match wins).
      {
        source: "/api/media/thumb",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Cache-Control",
            value:
              "public, max-age=604800, stale-while-revalidate=86400, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      ...(isProd
        ? [
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
      ...["svg", "png", "jpg", "jpeg", "gif", "webp", "ico", "woff2"].map(
        (ext) => ({
          source: `/:path*.${ext}`,
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=86400, stale-while-revalidate=604800",
            },
          ],
        })
      ),
    ];
  },
  async redirects() {
    return [
      {
        source: "/api/auth/error",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
