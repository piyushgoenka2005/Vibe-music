import type { NextConfig } from "next";
import { API_SECURITY_HEADERS, SECURITY_HEADERS } from "@/lib/security/headers";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "recharts",
      "framer-motion",
      "firebase/auth",
      "firebase/firestore",
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
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...SECURITY_HEADERS],
      },
      {
        source: "/api/:path*",
        headers: [...API_SECURITY_HEADERS],
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
};

export default nextConfig;
