import { PrismaClient } from "@prisma/client";

const FACEBOOK_URL = "https://www.facebook.com/vibemusicindiaofficial/";
const INSTAGRAM_URL = "https://www.instagram.com/vibemusicindia";

const prisma = new PrismaClient();

const updates = [
  { platform: "facebook", href: FACEBOOK_URL },
  { platform: "instagram", href: INSTAGRAM_URL },
] as const;

for (const { platform, href } of updates) {
  const result = await prisma.homepageSectionItem.updateMany({
    where: { sectionKey: "social_rail", customTitle: platform },
    data: { customHref: href, updatedAt: new Date().toISOString() },
  });
  console.log(`${platform}: updated ${result.count} row(s) → ${href}`);
}

await prisma.$disconnect();
