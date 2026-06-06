import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.sweetwater.com" },
      { protocol: "https", hostname: "cdn.vibemusic.com" },
    ],
  },
};

export default nextConfig;
