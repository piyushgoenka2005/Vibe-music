import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import "@/gp9/styles/gp9-globals.css";

export const metadata: Metadata = {
  title: `GP9 | ${BRAND.name}`,
  description:
    "Experience the Roland GP-9 digital grand — Sound Lab, cinematic showcase, and interactive 3D viewer.",
  alternates: { canonical: "/gp9" },
};

export default function Gp9Layout({ children }: { children: React.ReactNode }) {
  return <div className="gp9-site">{children}</div>;
}
