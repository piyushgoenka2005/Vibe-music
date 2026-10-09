/**
 * Rewrite banner image URLs off disallowed third-party hosts (e.g. postimage.me).
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/ops/migrate-external-banner-hosts.mts
 *   npx tsx --env-file=.env scripts/ops/migrate-external-banner-hosts.mts --dry-run
 */
import "./register-cli-stubs-side-effect.mts";
import { prisma } from "../../src/lib/db/prisma";

const DISALLOWED_HOSTS = ["postimage.me", "i.postimg.cc", "postimg.cc"];

function isDisallowed(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return DISALLOWED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
}

const dryRun = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  const banners = await prisma.banner.findMany();
  let touched = 0;

  for (const banner of banners) {
    const fields: Array<"image" | "mobileImage"> = ["image"];
    if (banner.mobileImage) fields.push("mobileImage");

    for (const field of fields) {
      const value = field === "image" ? banner.image : banner.mobileImage;
      if (!value || !isDisallowed(value)) continue;

      touched += 1;
      console.log(
        `${dryRun ? "[dry-run] " : ""}Banner ${banner.id} ${field}: ${value} — replace in admin/CDN, then re-run without --dry-run after updating DB.`,
      );
    }
  }

  if (touched === 0) {
    console.log("No banners on disallowed hosts.");
    return;
  }

  console.log(
    `\n${touched} banner field(s) need manual CDN URLs. Update rows in admin, or extend this script with a mapping table.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
