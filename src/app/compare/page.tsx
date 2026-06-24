import type { Metadata } from "next";
import ComparePage from "@/components/compare/ComparePage";

export const metadata: Metadata = {
  title: "Compare Products",
  description: "Compare pro audio and instrument specs side by side at Vibe Music.",
};

export default function CompareRoute() {
  return <ComparePage />;
}
