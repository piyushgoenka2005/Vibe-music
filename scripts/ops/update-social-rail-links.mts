import "./register-cli-stubs-side-effect.mts";

/**
 * Sync social rail + footer defaults in Postgres to official Vibe Music profiles.
 *
 * Usage: npm run ops:update-social-rail-links
 */
import { PrismaClient } from "@prisma/client";

const LINKS = {
  facebook: "https://www.facebook.com/vibemusicindiaofficial/",
  instagram: "https://www.instagram.com/vibemusicindia?stkn=MXQ5MDJqbmhwb3R6eQ==",
  linkedin: "https://x.com/",
  twitter: "https://x.com/",
} as const;

const prisma = new PrismaClient();

for (const [platform, href] of Object.entries(LINKS)) {
  const result = await prisma.homepageSectionItem.updateMany({
    where: { sectionKey: "social_rail", customTitle: platform },
    data: { customHref: href, updatedAt: new Date().toISOString() },
  });
  console.log(`${platform}: updated ${result.count} row(s) → ${href}`);
}

await prisma.$disconnect();
