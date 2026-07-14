import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RentalProductPageClient from "@/components/rentals/RentalProductPageClient";
import { getRentalProductBySlug } from "@/lib/server/rentalRepository";
import "@/styles/rentals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getRentalProductBySlug(slug);
  if (!product) return { title: "Rental" };
  return {
    title: `Rent ${product.name}`,
    description: product.description,
  };
}

export default async function RentalProductRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getRentalProductBySlug(slug);
  if (!product || product.status !== "active") notFound();
  return <RentalProductPageClient product={product} />;
}
