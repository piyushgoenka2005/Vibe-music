/**
 * Post-deploy smoke: homepage API must serve curated card art for flat packshots.
 *
 * Usage:
 *   npm run verify:homepage-images
 *   HOMEPAGE_VERIFY_URL=http://127.0.0.1:3000 node scripts/ops/verify/verify-homepage-images.mjs
 */
const BASE = (process.env.HOMEPAGE_VERIFY_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

/** CDN masters that read as blank circles in square cards — cards must use /images/ showcase. */
const FLAT_PACKSHOT_MARKERS = [
  "8dbab992-6ab1-4b7b-ae61-4ad72ec93351",
  "c2c0dad6-9522-4d44-b686-4ab6076b2d7d",
];

/** Misassigned drum-kit art that must never appear as a card primary image. */
const MISASSIGNED_MARKERS = ["e853f8d2-cfec-4a70-a7c8-ec3751205191"];

const CURATED_FLAT_SLUGS = [
  "avus-avus-crystone-6-avus-crystone-6",
  "avus-avus-crystone-8-avus-crystone-8",
  "avus-orlin-8-orlin-8",
];

function isBadPrimaryImage(slug, image) {
  if (!image) return "missing image";
  if (MISASSIGNED_MARKERS.some((m) => image.includes(m))) {
    return "misassigned drum art used as primary";
  }
  if (CURATED_FLAT_SLUGS.includes(slug) && !image.startsWith("/images/")) {
    return "flat-packshot SKU must use curated /images/ showcase art";
  }
  if (FLAT_PACKSHOT_MARKERS.some((m) => image.includes(m))) {
    return "flat CDN packshot used as primary card image";
  }
  return null;
}

async function main() {
  const url = `${BASE}/api/homepage`;
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    console.error(`FAIL — could not reach ${url}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`FAIL — ${url} returned ${response.status}`);
    process.exit(1);
  }

  const data = await response.json();
  const failures = [];

  for (const section of data.sections || []) {
    for (const product of section.products || []) {
      const reason = isBadPrimaryImage(product.slug, product.image);
      if (reason) {
        failures.push({
          section: section.key,
          slug: product.slug,
          image: product.image,
          reason,
        });
      }
    }
  }

  if (failures.length > 0) {
    console.error(`FAIL — ${failures.length} homepage product image issue(s):\n`);
    for (const item of failures) {
      console.error(`  [${item.section}] ${item.slug}: ${item.reason}`);
      console.error(`    image: ${item.image}`);
    }
    process.exit(1);
  }

  console.log(`PASS — homepage product card images OK (${url})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
