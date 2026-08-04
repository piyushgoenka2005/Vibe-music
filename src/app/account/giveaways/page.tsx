"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import AccountEmptyState from "@/components/account/AccountEmptyState";

type AccountGiveawayEntry = {
  id: string;
  entryNumber: string;
  totalEntries: number;
  emailVerified: boolean;
  status: string;
  referralCode: string;
  campaign?: { slug: string; title: string; prizeTitle: string };
};

function giveawayBadgeClass(status: string): string {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("win") || normalized.includes("drawn")) {
    return "acct__badge acct__badge--delivered";
  }
  if (normalized.includes("disqual") || normalized.includes("cancel")) {
    return "acct__badge acct__badge--cancelled";
  }
  if (normalized.includes("verif") || normalized.includes("active")) {
    return "acct__badge acct__badge--confirmed";
  }
  if (normalized.includes("process")) {
    return "acct__badge acct__badge--processing";
  }
  return "acct__badge acct__badge--pending";
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AccountGiveawaysPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["account-giveaways"],
    queryFn: async () => {
      const res = await fetch("/api/giveaway/account/entries");
      if (!res.ok) throw new Error("Unable to load giveaway entries");
      return res.json() as Promise<{ entries?: AccountGiveawayEntry[] }>;
    },
  });

  const entries = data?.entries ?? [];

  return (
    <div>
      <h1 className="acct__section-title">My Giveaways</h1>
      <p className="acct__section-sub">
        Track your entries, referral codes, and campaign status.
      </p>

      <div className="acct__toolbar">
        <Link
          href={ROUTES.giveaway}
          className="acct__btn acct__btn--secondary"
        >
          Browse live giveaways
        </Link>
      </div>

      <div className="acct__card">
        {isLoading ? (
          <p style={{ padding: 24, textAlign: "center", color: "#666" }}>
            Loading your giveaway entries…
          </p>
        ) : error ? (
          <p role="alert" style={{ padding: 24, color: "#c5221f" }}>
            {error instanceof Error
              ? error.message
              : "Unable to load giveaway entries"}
          </p>
        ) : entries.length === 0 ? (
          <AccountEmptyState
            icon={Gift}
            title="No Giveaway Entries Yet"
            description="Enter a live giveaway to start collecting entries. Your campaigns and referral codes will appear here."
            actionLabel="Enter a giveaway"
            actionHref={ROUTES.giveaway}
          />
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="acct__order">
              <div className="acct__order-main">
                <p className="acct__order-id">
                  {entry.campaign?.title ?? "Giveaway"} · {entry.entryNumber}
                </p>
                <p className="acct__order-meta">
                  {entry.campaign?.prizeTitle
                    ? `${entry.campaign.prizeTitle} · `
                    : ""}
                  {entry.totalEntries} entr
                  {entry.totalEntries === 1 ? "y" : "ies"} · Referral{" "}
                  {entry.referralCode}
                </p>
                <p className="acct__order-meta acct__entry-verify">
                  {entry.emailVerified
                    ? "Email verified"
                    : "Pending email verification"}
                </p>
              </div>
              <span className={giveawayBadgeClass(entry.status)}>
                {formatStatusLabel(entry.status)}
              </span>
              <div className="acct__order-summary">
                <div className="acct__order-actions">
                  {entry.campaign?.slug ? (
                    <Link
                      href={`/giveaway/${entry.campaign.slug}`}
                      className="acct__btn acct__btn--secondary acct__btn--sm"
                    >
                      View campaign
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
