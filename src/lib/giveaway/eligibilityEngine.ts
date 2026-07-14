import type {
  GiveawayCampaign,
  GiveawayEntry,
} from "@/types/giveaway";

export function getCampaignPhase(
  campaign: Pick<GiveawayCampaign, "status" | "startsAt" | "endsAt">,
  now = new Date()
): "upcoming" | "open" | "closed" | "cancelled" {
  if (campaign.status === "cancelled") return "cancelled";
  const ts = now.getTime();
  const start = new Date(campaign.startsAt).getTime();
  const end = new Date(campaign.endsAt).getTime();
  if (ts < start) return "upcoming";
  if (ts > end) return "closed";
  if (campaign.status === "active" || campaign.status === "scheduled") return "open";
  return "closed";
}

export function isCampaignAcceptingEntries(
  campaign: Pick<
    GiveawayCampaign,
    "status" | "startsAt" | "endsAt" | "maxEntries" | "entryCount"
  >
): { ok: boolean; reason?: string } {
  const phase = getCampaignPhase(campaign);
  if (phase === "cancelled") return { ok: false, reason: "This giveaway has been cancelled" };
  if (phase === "upcoming") return { ok: false, reason: "This giveaway has not started yet" };
  if (phase === "closed") return { ok: false, reason: "Entry period has ended" };
  if (!["active", "scheduled"].includes(campaign.status)) {
    return { ok: false, reason: "This giveaway is not accepting entries" };
  }
  if (
    campaign.maxEntries != null &&
    (campaign.entryCount ?? 0) >= campaign.maxEntries
  ) {
    return { ok: false, reason: "This giveaway has reached maximum entries" };
  }
  return { ok: true };
}

export function evaluateGiveawayEligibility(input: {
  campaign: GiveawayCampaign;
  email: string;
  customerPhone: string;
  ageConfirmed?: boolean;
  requireLogin?: boolean;
  isLoggedIn?: boolean;
}): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const rules = input.campaign.eligibilityRules ?? {};
  const acceptance = isCampaignAcceptingEntries(input.campaign);
  if (!acceptance.ok) reasons.push(acceptance.reason ?? "Not eligible");

  if (input.campaign.requireLogin && !input.isLoggedIn) {
    reasons.push("You must be signed in to enter this giveaway");
  }

  if (rules.requirePhone && !input.customerPhone.trim()) {
    reasons.push("Phone number is required");
  }

  if (rules.minAge && !input.ageConfirmed) {
    reasons.push(`You must confirm you are at least ${rules.minAge} years old`);
  }

  const domain = input.email.split("@")[1]?.toLowerCase();
  if (domain && rules.blockedEmailDomains?.includes(domain)) {
    reasons.push("Email domain is not allowed for this giveaway");
  }

  return { eligible: reasons.length === 0, reasons };
}

export function countWeightedTickets(entries: Pick<GiveawayEntry, "id" | "totalEntries" | "status">[]): number {
  return entries
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + Math.max(1, e.totalEntries), 0);
}
