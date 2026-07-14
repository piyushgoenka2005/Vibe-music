import type { GiveawayCampaign, GiveawayEntry } from "@/types/giveaway";
import { sendMail } from "@/lib/server/email/smtp";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { getPublicSiteUrl } from "@/lib/publicSiteUrl";
import { logInfo } from "@/lib/server/logger";

type GiveawayEmailEvent = "verify" | "confirmed" | "winner";

function subjectFor(event: GiveawayEmailEvent, campaign: GiveawayCampaign): string {
  if (event === "verify") return `Verify your giveaway entry — ${campaign.title}`;
  if (event === "winner") return `You won! — ${campaign.title}`;
  return `Giveaway entry confirmed — ${campaign.title}`;
}

function bodyFor(
  event: GiveawayEmailEvent,
  entry: GiveawayEntry,
  campaign: GiveawayCampaign,
  verifyToken?: string
): string {
  const lines = [
    `Hello ${entry.customerName},`,
    "",
    `Campaign: ${campaign.title}`,
    `Prize: ${campaign.prizeTitle}`,
    `Entry #: ${entry.entryNumber}`,
    `Total entries: ${entry.totalEntries}`,
    "",
  ];

  if (event === "verify" && verifyToken) {
    lines.push(
      "Please verify your email to confirm your giveaway entry:",
      `${getPublicSiteUrl()}/giveaway/verify?token=${verifyToken}`,
      "",
      "Your referral code (share for bonus entries):",
      entry.referralCode
    );
  } else if (event === "winner") {
    lines.push(
      "Congratulations! You have been selected as a winner.",
      "Our team will contact you shortly with prize fulfillment details."
    );
  } else {
    lines.push(
      "Your giveaway entry is confirmed.",
      "",
      "Share your referral code for bonus entries:",
      entry.referralCode
    );
  }

  lines.push("", "— Vibe Music Giveaways");
  return lines.join("\n");
}

/**
 * Sends giveaway mail. Throws when the critical verify email cannot be delivered
 * so callers can surface a clear error instead of leaving users stuck.
 */
export async function sendGiveawayEmail(
  entry: GiveawayEntry,
  campaign: GiveawayCampaign,
  event: GiveawayEmailEvent,
  verifyToken?: string
): Promise<void> {
  try {
    const text = bodyFor(event, entry, campaign, verifyToken);
    await sendMail({
      from: formatMailboxFrom("orders"),
      to: entry.email,
      subject: subjectFor(event, campaign),
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${text}</pre>`,
      text,
    });
  } catch (error) {
    logInfo("Giveaway email failed", "giveaway-email", {
      entryId: entry.id,
      event,
      error: error instanceof Error ? error.message : String(error),
    });
    if (event === "verify") {
      throw new Error(
        "We could not send the verification email. Please try again in a few minutes, or contact support."
      );
    }
  }
}
