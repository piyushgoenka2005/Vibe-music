"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import type { GiveawayEntry, GiveawaySocialPlatform } from "@/types/giveaway";

const SOCIAL_PLATFORMS: GiveawaySocialPlatform[] = ["instagram", "youtube", "facebook", "x"];

export default function GiveawaySuccessPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("token") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["giveaway-entry", id, token],
    enabled: Boolean(id && token),
    queryFn: async () => {
      const res = await fetch(`/api/giveaway/entries/${id}?trackingToken=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<{ entry: GiveawayEntry }>;
    },
  });

  const socialMutation = useMutation({
    mutationFn: async (platform: GiveawaySocialPlatform) => {
      const res = await fetch(
        `/api/giveaway/entries/${id}/social?trackingToken=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Claim failed");
      return json.entry as GiveawayEntry;
    },
  });

  const entry = data?.entry;

  return (
    <main className="storefront-page giveaway-page">
      <section className="giveaway-card">
        <h1>Entry submitted</h1>
        {isLoading ? (
          <p>Loading…</p>
        ) : entry ? (
          <>
            <p>
              Entry <strong>{entry.entryNumber}</strong> — {entry.totalEntries} total entries
            </p>
            {!entry.emailVerified ? (
              <p>Check your email to verify your entry and unlock the draw pool.</p>
            ) : (
              <p>Your email is verified. Good luck!</p>
            )}
            <p>
              Your referral code: <strong>{entry.referralCode}</strong>
            </p>
            <div className="giveaway-social">
              <h2>Bonus social entries</h2>
              <p>Claim after sharing the campaign on each platform:</p>
              <div className="giveaway-actions">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const claimed = entry.socialClaims.some((c) => c.platform === platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      className="btn btn--secondary"
                      disabled={claimed || socialMutation.isPending}
                      onClick={() => socialMutation.mutate(platform)}
                    >
                      {claimed ? `${platform} claimed` : `Claim ${platform}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <p>Entry not found.</p>
        )}
        <div className="giveaway-actions">
          <Link href={ROUTES.accountGiveaways} className="btn btn--primary">
            My giveaway entries
          </Link>
          <Link href={ROUTES.giveaway} className="btn btn--secondary">
            All giveaways
          </Link>
        </div>
      </section>
    </main>
  );
}
