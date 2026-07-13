"use client";

import { usePathname } from "next/navigation";
import SocialRail from "@/components/layout/SocialRail";

export default function SocialRailGate() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/gp9")) return null;
  return <SocialRail />;
}
