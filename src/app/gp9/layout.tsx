import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `GP9 | ${BRAND.name}`,
  description:
    "Experience the GP9 interactive guitar viewer — explore specifications, finishes, and details in 3D.",
  alternates: { canonical: "/gp9" },
};

export default function Gp9Layout({ children }: { children: React.ReactNode }) {
  return children;
}
