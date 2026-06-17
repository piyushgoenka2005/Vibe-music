import type { Metadata } from "next";
import { SmoothScrollProvider } from "@/gp9/components/smooth-scroll-provider";
import "@/gp9/styles/gp9-globals.css";

export const metadata: Metadata = {
  title: "Roland GP-9 | Vibe Music",
  description:
    "Roland GP-9 digital grand piano. Modern elegance, authentic touch, and immersive sound for the home.",
};

export default function Gp9Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gp9-site gp9-route">
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </div>
  );
}
