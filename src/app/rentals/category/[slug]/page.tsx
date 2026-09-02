import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RentalsHubPage from "@/components/rentals/RentalsHubPage";
import { getRentalCategoryBySlug } from "@/lib/server/rentalRepository";
import { withServerPageError } from "@/components/common/ServerPageErrorFallback";
import "@/styles/rentals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getRentalCategoryBySlug(slug);
  return {
    title: category ? `${category.name} Rentals` : "Rentals",
    description: category?.description,
  };
}

export default async function RentalCategoryRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return withServerPageError(async () => {
    const { slug } = await params;
    const category = await getRentalCategoryBySlug(slug);
    if (!category || category.status !== "active") notFound();
    return <RentalsHubPage initialCategorySlug={slug} />;
  }, "Rental Category");
}
