/**
 * Seed giveaway campaigns.
 * Usage: npx tsx --env-file=.env.local scripts/catalog/seed-giveaway.mts
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const startsAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const ts = now.toISOString();

  const campaignId = "gw-summer-strat";
  await prisma.giveawayCampaign.upsert({
    where: { id: campaignId },
    create: {
      id: campaignId,
      slug: "summer-strat-giveaway",
      title: "Summer Strat Giveaway",
      subtitle: "Win a premium electric guitar — one lucky musician takes it home.",
      description:
        "Enter for a chance to win a Fender Player Stratocaster. Share your referral code and social posts for bonus entries.",
      status: "active",
      prizeTitle: "Fender Player Stratocaster",
      prizeDescription: "Polar White, maple neck, gig bag included.",
      prizeValue: 89999,
      winnerCount: 1,
      maxEntries: 5000,
      startsAt,
      endsAt,
      drawAt: endsAt,
      requireLogin: false,
      requireEmailVerification: true,
      referralBonusEntries: 1,
      socialBonusEntries: 1,
      allowedSocialPlatforms: ["instagram", "youtube", "facebook", "x"],
      eligibilityRules: {
        minAge: 18,
        requirePhone: true,
        maxEntriesPerIp: 3,
      },
      termsHtml:
        "<p>Open to residents of India aged 18+. One entry per email. Winners contacted by email within 7 days of draw.</p>",
      faqs: [
        {
          question: "How do bonus entries work?",
          answer: "Refer a friend or claim a social share after entry for +1 entry each.",
        },
        {
          question: "When is the draw?",
          answer: "After the campaign ends, admins run a weighted random draw from verified entries.",
        },
      ],
      featured: true,
      createdAt: ts,
      updatedAt: ts,
    },
    update: {
      status: "active",
      startsAt,
      endsAt,
      updatedAt: ts,
    },
  });

  await prisma.giveawayCampaignEvent.create({
    data: {
      id: randomUUID(),
      campaignId,
      type: "seed",
      message: "Campaign seeded",
      createdAt: ts,
    },
  });

  console.log("Seeded 1 active giveaway campaign.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
