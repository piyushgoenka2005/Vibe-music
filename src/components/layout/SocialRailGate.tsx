"use client";

import { usePathname } from "next/navigation";
import SocialRail from "@/components/layout/SocialRail";
import type { SocialRailPublicConfig } from "@/lib/socialRail";

interface SocialRailGateProps {
  config: SocialRailPublicConfig;
}

export default function SocialRailGate({ config }: SocialRailGateProps) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/gp9")) return null;
  if (!config.isActive) return null;
  return <SocialRail config={config} />;
}
