import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GiveawayCampaignPage from "@/components/giveaway/GiveawayCampaignPage";
import { getGiveawayCampaignBySlug } from "@/lib/server/giveaway/giveawayRepository";
import { withServerPageError } from "@/lib/serverPageError";
import "@/styles/storefront-pages.css";
import "@/styles/giveaway.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Giveaway — ${slug.replace(/-/g, " ")}`,
    description: "Enter the Vibe Music gear giveaway.",
  };
}

export default async function GiveawayCampaignRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return withServerPageError(async () => {
    const { slug } = await params;
    const campaign = await getGiveawayCampaignBySlug(slug);
    if (!campaign || campaign.status !== "active") notFound();
    return <GiveawayCampaignPage slug={slug} />;
  }, "Giveaway");
}
