"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import "@/styles/giveaway.css";

export default function AccountGiveawaysPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["account-giveaways"],
    queryFn: async () => {
      const res = await fetch("/api/giveaway/account/entries");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const entries = data?.entries ?? [];

  return (
    <>
      <h1>My giveaway entries</h1>
      <p style={{ marginBottom: "1rem" }}>
        <Link href={ROUTES.giveaway}>Browse live giveaways</Link>
      </p>
      {isLoading ? (
        <p>Loading…</p>
      ) : entries.length === 0 ? (
        <p>No giveaway entries yet.</p>
      ) : (
        <div className="giveaway-list">
          {entries.map((entry: {
            id: string;
            entryNumber: string;
            totalEntries: number;
            emailVerified: boolean;
            status: string;
            referralCode: string;
            campaign?: { slug: string; title: string; prizeTitle: string };
          }) => (
            <article key={entry.id} className="giveaway-list-item">
              <strong>{entry.entryNumber}</strong>
              <div>{entry.campaign?.title ?? "Giveaway"}</div>
              <div>{entry.campaign?.prizeTitle}</div>
              <div>{entry.totalEntries} entries · {entry.status}</div>
              <div>{entry.emailVerified ? "Verified" : "Pending email verification"}</div>
              <div>Referral: {entry.referralCode}</div>
              {entry.campaign?.slug ? (
                <Link href={`/giveaway/${entry.campaign.slug}`}>View campaign</Link>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
