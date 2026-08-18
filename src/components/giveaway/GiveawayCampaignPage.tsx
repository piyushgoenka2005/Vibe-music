"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import CountdownTimer from "@/components/giveaway/CountdownTimer";
import ProductImage from "@/components/common/ProductImage";
import { getCampaignPhase } from "@/lib/giveaway/eligibilityEngine";
import { ROUTES } from "@/lib/routes";
import { sanitizeHtml } from "@/lib/security/sanitize";
import { useAuthStore } from "@/store/authStore";
import type { GiveawayCampaign } from "@/types/giveaway";

export default function GiveawayCampaignPage({ slug }: { slug: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState(user?.email ?? "");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["giveaway-campaign", slug],
    queryFn: async () => {
      const [campaignRes, winnersRes] = await Promise.all([
        fetch(`/api/giveaway/campaigns/${slug}`),
        fetch(`/api/giveaway/campaigns/${slug}/winners`),
      ]);
      if (!campaignRes.ok) throw new Error("Campaign not found");
      const campaignJson = await campaignRes.json();
      const winnersJson = winnersRes.ok ? await winnersRes.json() : { winners: [] };
      return {
        campaign: campaignJson.campaign as GiveawayCampaign,
        winners: winnersJson.winners as Array<{ rank: number; customerName?: string; entryNumber?: string }>,
      };
    },
  });

  const entryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/giveaway/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignSlug: slug,
          email,
          customerName,
          customerPhone,
          referralCode: referralCode || undefined,
          ageConfirmed: ageConfirmed || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Entry failed");
      return json.entry as { id: string; trackingToken: string };
    },
    onSuccess: (entry) => {
      router.push(`/giveaway/success?id=${entry.id}&token=${entry.trackingToken}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Entry failed"),
  });

  if (isLoading) return <p>Loading campaign…</p>;
  if (!data?.campaign) return <p>Campaign not found.</p>;

  const { campaign, winners } = data;
  const phase = getCampaignPhase(campaign);
  const isOpen = phase === "open";
  const rules = campaign.eligibilityRules ?? {};

  return (
    <main className="storefront-page giveaway-page">
      <Link href={ROUTES.giveaway} className="giveaway-back">
        ← All giveaways
      </Link>

      <header className="giveaway-hero">
        <p className="rentals-hero__eyebrow">{phase === "open" ? "Live giveaway" : "Campaign"}</p>
        <h1 className="rentals-hero__title">{campaign.title}</h1>
        <p className="rentals-hero__subtitle">{campaign.subtitle || campaign.prizeTitle}</p>
        {isOpen ? (
          <CountdownTimer targetIso={campaign.endsAt} />
        ) : phase === "upcoming" ? (
          <CountdownTimer targetIso={campaign.startsAt} label="Starts in" />
        ) : null}
      </header>

      <div className="giveaway-grid giveaway-grid--split">
        <section className="giveaway-card">
          <h2>Prize</h2>
          {campaign.prizeImageUrl ? (
            <div className="giveaway-card__visual">
              <ProductImage
                src={campaign.prizeImageUrl}
                alt=""
                className="giveaway-card__image"
              />
            </div>
          ) : null}
          <h3>{campaign.prizeTitle}</h3>
          <p>{campaign.prizeDescription}</p>
          <p>{campaign.entryCount ?? 0} entries so far</p>
        </section>

        {isOpen ? (
          <section className="giveaway-card" aria-label="Entry form">
            <h2>Enter giveaway</h2>
            {campaign.requireLogin && !user ? (
              <p>
                Please <Link href={ROUTES.login}>sign in</Link> to enter.
              </p>
            ) : (
              <form
                className="giveaway-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  entryMutation.mutate();
                }}
              >
                <label>
                  Full name
                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Phone
                  <input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </label>
                <label>
                  Referral code (optional)
                  <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
                </label>
                {rules.minAge ? (
                  <label className="giveaway-checkbox">
                    <input
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                    />
                    I confirm I am at least {rules.minAge} years old
                  </label>
                ) : null}
                {error ? <p className="giveaway-error">{error}</p> : null}
                <button type="submit" className="btn btn--primary" disabled={entryMutation.isPending}>
                  {entryMutation.isPending ? "Submitting…" : "Submit entry"}
                </button>
              </form>
            )}
            <p className="giveaway-note">
              Refer friends (+{campaign.referralBonusEntries} entry each) and share on social
              (+{campaign.socialBonusEntries} per platform) after submitting.
            </p>
          </section>
        ) : (
          <section className="giveaway-card">
            <h2>Entries closed</h2>
            <p>This campaign is not accepting new entries.</p>
          </section>
        )}
      </div>

      {campaign.faqs.length > 0 ? (
        <section className="giveaway-faqs">
          <h2>FAQs</h2>
          {campaign.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
      ) : null}

      {campaign.termsHtml ? (
        <section className="giveaway-terms">
          <h2>Terms & conditions</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(campaign.termsHtml),
            }}
          />
        </section>
      ) : null}

      {winners.length > 0 ? (
        <section className="giveaway-winners">
          <h2>Winners</h2>
          <ol>
            {winners.map((w) => (
              <li key={w.rank}>
                #{w.rank} — {w.customerName} ({w.entryNumber})
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
