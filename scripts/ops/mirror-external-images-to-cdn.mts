/**
 * Copy banner, homepage CMS and product images hosted on postimage.me / postimg.cc
 * onto the VPS CDN and point the rows at the CDN copy. A row is only rewritten after
 * its image was stored, so admin content is never replaced with stock art.
 *
 * Usage (VPS):
 *   NODE_ENV=production npx tsx --env-file=.env scripts/ops/mirror-external-images-to-cdn.mts [--dry-run]
 */
import "./register-cli-stubs-side-effect.mts";
import { Prisma } from "@prisma/client";
import { prisma } from "../../src/lib/db/prisma";
import {
  bannerUploadFolder,
  getCdnPublicBaseUrl,
  productUploadFolder,
} from "../../src/lib/server/platform/cdnStorage";
import {
  isMirrorableExternalImageUrl,
  mirrorExternalImageToCdn,
} from "../../src/lib/server/platform/mirrorExternalImage";

const dryRun = process.argv.includes("--dry-run");
const mirroredUrls = new Map<string, string>();
let copied = 0;
let failed = 0;

async function mirror(url: string, folder: string): Promise<string> {
  const cached = mirroredUrls.get(url);
  if (cached) return cached;
  if (dryRun) {
    console.log(`  [dry-run] would mirror ${url} → ${folder}/`);
    return url;
  }
  const next = await mirrorExternalImageToCdn(url, folder);
  if (next === url) {
    failed += 1;
    console.warn(`  WARN could not mirror ${url} — left unchanged`);
  } else {
    copied += 1;
    mirroredUrls.set(url, next);
    console.log(`  ${url} → ${next}`);
  }
  return next;
}

async function mirrorBanners(now: string): Promise<void> {
  const banners = await prisma.banner.findMany();
  for (const banner of banners) {
    const image = isMirrorableExternalImageUrl(banner.image)
      ? await mirror(banner.image, bannerUploadFolder())
      : banner.image;
    const mobileImage =
      banner.mobileImage && isMirrorableExternalImageUrl(banner.mobileImage)
        ? await mirror(banner.mobileImage, bannerUploadFolder())
        : banner.mobileImage;
    if (dryRun || (image === banner.image && mobileImage === banner.mobileImage)) continue;
    await prisma.banner.update({
      where: { id: banner.id },
      data: { image, mobileImage, updatedAt: now },
    });
  }
}

async function mirrorHomepageItems(now: string): Promise<void> {
  const items = await prisma.homepageSectionItem.findMany({
    where: {
      OR: [
        { customImage: { contains: "postimage", mode: "insensitive" } },
        { customImage: { contains: "postimg", mode: "insensitive" } },
      ],
    },
  });
  for (const item of items) {
    if (!item.customImage || !isMirrorableExternalImageUrl(item.customImage)) continue;
    const customImage = await mirror(item.customImage, bannerUploadFolder());
    if (dryRun || customImage === item.customImage) continue;
    await prisma.homepageSectionItem.update({
      where: { id: item.id },
      data: { customImage, updatedAt: now },
    });
  }
}

type GalleryEntry = string | { src?: string; [key: string]: unknown };

async function mirrorProducts(now: string): Promise<void> {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, categorySlug: true, image: true, images: true },
  });
  for (const product of products) {
    const folder = productUploadFolder(product.categorySlug, product.slug);
    const image = isMirrorableExternalImageUrl(product.image)
      ? await mirror(product.image, folder)
      : product.image;

    const gallery = Array.isArray(product.images) ? (product.images as GalleryEntry[]) : [];
    let galleryChanged = false;
    const images: GalleryEntry[] = [];
    for (const entry of gallery) {
      const src = typeof entry === "string" ? entry : entry?.src;
      if (!src || !isMirrorableExternalImageUrl(src)) {
        images.push(entry);
        continue;
      }
      const next = await mirror(src, folder);
      galleryChanged ||= next !== src;
      images.push(typeof entry === "string" ? next : { ...entry, src: next });
    }

    if (dryRun || (image === product.image && !galleryChanged)) continue;
    await prisma.product.update({
      where: { id: product.id },
      data: {
        image,
        ...(galleryChanged ? { images: images as Prisma.InputJsonValue } : {}),
        updatedAt: now,
      },
    });
  }
}

async function main(): Promise<void> {
  const cdnBase = getCdnPublicBaseUrl();
  if (!dryRun && !cdnBase.startsWith("https://")) {
    console.log(`SKIP external image mirror — CDN base is ${cdnBase} (run with NODE_ENV=production on the VPS)`);
    return;
  }

  const now = new Date().toISOString();
  await mirrorBanners(now);
  await mirrorHomepageItems(now);
  await mirrorProducts(now);

  if (copied === 0 && failed === 0) {
    console.log("No banner, homepage or product images on postimage/postimg hosts.");
    return;
  }
  console.log(`Mirrored ${copied} image(s) to ${cdnBase}; ${failed} left on original host.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
