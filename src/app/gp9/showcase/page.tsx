import type { Metadata } from "next";
import Gp9ShowcasePage from "@/gp9/components/gp9-cinematics/gp9-showcase-page";

export const metadata: Metadata = {
  title: "GP-9 Showcase | Vibe Music",
  description:
    "Seven scroll-triggered cinematic shots of the Roland GP-9 digital grand — camera, lighting, and choreography.",
};

export default function Gp9ShowcaseRoute() {
  return <Gp9ShowcasePage />;
}
