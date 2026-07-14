"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import { getCampaignPhase } from "@/lib/giveaway/eligibilityEngine";
import CountdownTimer from "@/components/giveaway/CountdownTimer";
import type { GiveawayCampaign } from "@/types/giveaway";

export default function GiveawayHubPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["giveaway-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/giveaway/campaigns");
      return res.json() as Promise<{ campaigns: GiveawayCampaign[] }>;
    },
  });

  const campaigns = data?.campaigns ?? [];
  const active = campaigns.filter((c) => getCampaignPhase(c) === "open");
  const upcoming = campaigns.filter((c) => getCampaignPhase(c) === "upcoming");
  const past = campaigns.filter((c) => getCampaignPhase(c) === "closed");

  return (
    <main className="storefront-page giveaway-page">
      <header className="giveaway-hero">
        <p className="rentals-hero__eyebrow">Promotions</p>
        <h1 className="rentals-hero__title">Giveaways & contests</h1>
        <p className="rentals-hero__subtitle">
          Enter live gear giveaways, earn bonus entries with referrals and social shares, and track
          your entries from your account.
        </p>
      </header>

      {isLoading ? (
        <p>Loading campaigns…</p>
      ) : active.length === 0 && upcoming.length === 0 ? (
        <section className="giveaway-card giveaway-empty" aria-label="No active giveaway">
          <h2>No live giveaway right now</h2>
          <p>
            There is no active contest open for entries. When a campaign launches, rules and
            deadlines will appear here.
          </p>
          <div className="giveaway-actions">
            <Link href={ROUTES.deals} className="btn btn--primary">
              Browse deals
            </Link>
            <Link href={ROUTES.search} className="btn btn--secondary">
              Shop catalog
            </Link>
          </div>
        </section>
      ) : (
        <div className="giveaway-grid">
          {[...active, ...upcoming].map((campaign) => (
            <article key={campaign.id} className="giveaway-card">
              {campaign.prizeImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaign.prizeImageUrl}
                  alt=""
                  className="giveaway-card__image"
                />
              ) : null}
              <p className="giveaway-card__eyebrow">
                {getCampaignPhase(campaign) === "open" ? "Live now" : "Coming soon"}
              </p>
              <h2>{campaign.title}</h2>
              <p>{campaign.prizeTitle}</p>
              {getCampaignPhase(campaign) === "open" ? (
                <CountdownTimer targetIso={campaign.endsAt} />
              ) : (
                <CountdownTimer targetIso={campaign.startsAt} label="Starts in" />
              )}
              <Link href={`/giveaway/${campaign.slug}`} className="btn btn--primary">
                View & enter
              </Link>
            </article>
          ))}
        </div>
      )}

      {past.length > 0 ? (
        <section className="giveaway-past" style={{ marginTop: "2rem" }}>
          <h2>Past campaigns</h2>
          <ul>
            {past.map((c) => (
              <li key={c.id}>
                <Link href={`/giveaway/${c.slug}`}>{c.title}</Link>
                {c.winnersAnnounced ? " — winners announced" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
