/**
 * Analyze product image framing: canvas size, bounding box, occupancy %.
 *
 * Usage:
 *   npx tsx scripts/ops/analyze-product-image-framing.mts
 *   npx tsx --env-file=.env scripts/ops/analyze-product-image-framing.mts --limit 20
 *   BASE_URL=https://vibemusic.in npx tsx scripts/ops/analyze-product-image-framing.mts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const WHITE_THRESHOLD = 248;
const ALPHA_THRESHOLD = 12;
const DEFAULT_LIMIT = 20;
const HIGH_OCCUPANCY = 85;

interface SampleRow {
  slug: string;
  name: string;
  url: string;
  canvasW: number;
  canvasH: number;
  bboxW: number;
  bboxH: number;
  occupancyPct: number;
  hasAlpha: boolean;
  format: string;
  notes: string;
}

function parseArgs(): { limit: number; baseUrl: string | null; outPath: string } {
  const args = process.argv.slice(2);
  let limit = DEFAULT_LIMIT;
  let baseUrl: string | null = process.env.BASE_URL?.trim() || null;
  let outPath = resolve(process.cwd(), "docs/ops/product-image-framing-report.csv");

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = Math.max(1, Number(args[i + 1]) || DEFAULT_LIMIT);
      i += 1;
    } else if (args[i] === "--base-url" && args[i + 1]) {
      baseUrl = args[i + 1]!;
      i += 1;
    } else if (args[i] === "--out" && args[i + 1]) {
      outPath = resolve(process.cwd(), args[i + 1]!);
      i += 1;
    }
  }

  return { limit, baseUrl, outPath };
}

async function fetchSamplesFromDb(limit: number): Promise<Array<{ slug: string; name: string; image: string }>> {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.product.findMany({
      where: { status: "active", image: { not: "" } },
      select: { slug: true, name: true, image: true },
      take: limit * 3,
      orderBy: { updatedAt: "desc" },
    });
    const unique = new Map<string, { slug: string; name: string; image: string }>();
    for (const row of rows) {
      const image = row.image?.trim();
      if (!image || unique.has(image)) continue;
      unique.set(image, { slug: row.slug, name: row.name, image });
      if (unique.size >= limit) break;
    }
    return [...unique.values()];
  } finally {
    await prisma.$disconnect();
  }
}

async function fetchSamplesFromApi(
  baseUrl: string,
  limit: number
): Promise<Array<{ slug: string; name: string; image: string }>> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/products?limit=${limit * 2}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  const body = (await res.json()) as {
    products?: Array<{ slug: string; name: string; image?: string }>;
  };
  const unique = new Map<string, { slug: string; name: string; image: string }>();
  for (const product of body.products ?? []) {
    const image = product.image?.trim();
    if (!image || unique.has(image)) continue;
    unique.set(image, { slug: product.slug, name: product.name, image });
    if (unique.size >= limit) break;
  }
  return [...unique.values()];
}

function resolveAbsoluteUrl(image: string, baseUrl: string | null): string {
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (baseUrl) return `${baseUrl.replace(/\/$/, "")}${image.startsWith("/") ? image : `/${image}`}`;
  return image;
}

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      return res;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError;
}

async function analyzeImage(
  sample: { slug: string; name: string; image: string },
  baseUrl: string | null
): Promise<SampleRow> {
  const url = resolveAbsoluteUrl(sample.image, baseUrl);
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    return {
      slug: sample.slug,
      name: sample.name,
      url,
      canvasW: 0,
      canvasH: 0,
      bboxW: 0,
      bboxH: 0,
      occupancyPct: 0,
      hasAlpha: false,
      format: "unknown",
      notes: `fetch failed HTTP ${res.status}`,
    };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const image = sharp(buffer);
  const meta = await image.metadata();
  const canvasW = meta.width ?? 0;
  const canvasH = meta.height ?? 0;
  const hasAlpha = meta.hasAlpha === true;

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  const channels = info.channels;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * channels;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const a = channels === 4 ? data[i + 3]! : 255;
      const isContent =
        a > ALPHA_THRESHOLD &&
        !(r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD);
      if (!isContent) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const bboxW = maxX >= minX ? maxX - minX + 1 : 0;
  const bboxH = maxY >= minY ? maxY - minY + 1 : 0;
  const canvasArea = canvasW * canvasH;
  const bboxArea = bboxW * bboxH;
  const occupancyPct =
    canvasArea > 0 && bboxArea > 0 ? Math.round((bboxArea / canvasArea) * 1000) / 10 : 0;

  let notes = "";
  if (occupancyPct >= HIGH_OCCUPANCY) notes = "tight crop";
  else if (occupancyPct > 0 && occupancyPct < 50) notes = "large whitespace";
  else if (occupancyPct === 0) notes = "no content detected";

  return {
    slug: sample.slug,
    name: sample.name,
    url,
    canvasW,
    canvasH,
    bboxW,
    bboxH,
    occupancyPct,
    hasAlpha,
    format: meta.format ?? "unknown",
    notes,
  };
}

function toCsv(rows: SampleRow[]): string {
  const headers = [
    "slug",
    "name",
    "url",
    "canvasW",
    "canvasH",
    "bboxW",
    "bboxH",
    "occupancyPct",
    "hasAlpha",
    "format",
    "notes",
  ];
  const escape = (v: string | number | boolean) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h as keyof SampleRow])).join(","))].join(
    "\n"
  );
}

async function main(): Promise<void> {
  const { limit, baseUrl, outPath } = parseArgs();
  let samples: Array<{ slug: string; name: string; image: string }> = [];

  try {
    samples = await fetchSamplesFromDb(limit);
    console.log(`Loaded ${samples.length} samples from database`);
  } catch (error) {
    console.warn("Database unavailable, falling back to API:", error instanceof Error ? error.message : error);
  }

  if (samples.length === 0) {
    const apiBase = baseUrl ?? "https://vibemusic.in";
    samples = await fetchSamplesFromApi(apiBase, limit);
    console.log(`Loaded ${samples.length} samples from ${apiBase}`);
  }

  if (samples.length === 0) {
    console.error("No product images to analyze");
    process.exitCode = 1;
    return;
  }

  const rows: SampleRow[] = [];
  for (const sample of samples) {
    process.stdout.write(`Analyzing ${sample.slug}…\n`);
    rows.push(await analyzeImage(sample, baseUrl));
  }

  writeFileSync(outPath, toCsv(rows), "utf8");

  const highOccupancy = rows.filter((r) => r.occupancyPct >= HIGH_OCCUPANCY).length;
  const pctHigh = rows.length > 0 ? Math.round((highOccupancy / rows.length) * 100) : 0;
  const avgOccupancy =
    rows.length > 0
      ? Math.round((rows.reduce((sum, r) => sum + r.occupancyPct, 0) / rows.length) * 10) / 10
      : 0;

  console.log("\n--- Summary ---");
  console.log(`Samples: ${rows.length}`);
  console.log(`Average occupancy: ${avgOccupancy}%`);
  console.log(`High occupancy (>=${HIGH_OCCUPANCY}%): ${highOccupancy} (${pctHigh}%)`);
  console.log(`Report: ${outPath}`);
  console.log(
    pctHigh > 30
      ? "Asset framing likely contributes (Root Cause A) — consider catalog derivatives."
      : "Primary issue is likely CSS resting scale (Root Cause E)."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
