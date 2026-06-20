import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://cdnjs.cloudflare.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.vibemusic.in https://accounts.google.com https://checkout.razorpay.com https://*.razorpay.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://cdn.vibemusic.in https://checkout.razorpay.com https://*.razorpay.com",
      "connect-src 'self' blob: https://*.googleapis.com https://*.firebaseio.com https://firebase.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://*.cloudinary.com https://tonejs.github.io wss://*.firebaseio.com",
      "media-src 'self' blob: https://tonejs.github.io",
      "worker-src 'self' blob:",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://sketchfab.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "recharts",
      "framer-motion",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.vibemusic.in" },
      { protocol: "https", hostname: "static.roland.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
