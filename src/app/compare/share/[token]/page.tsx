import type { Metadata } from "next";
import CompareSharePage from "@/components/compare/CompareSharePage";
import "@/styles/storefront-pages.css";
import "@/styles/compare.css";

export const metadata: Metadata = {
  title: "Shared Product Comparison",
  description: "View a shared product comparison at Vibe Music.",
};

export default async function CompareShareRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CompareSharePage token={token} />;
}
