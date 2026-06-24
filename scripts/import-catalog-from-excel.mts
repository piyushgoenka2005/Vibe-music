/**
 * Import real catalog from Excel + local image folders → Cloudinary + products.json.
 *
 * Usage:
 *   npm run import:catalog -- --dry-run
 *   npm run import:catalog -- --upload
 *   npm run import:catalog -- --confirm
 *   npm run import:catalog -- --upload --replace-images
 *   npm run import:catalog -- --update-prices
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import XLSX from "xlsx";
import { slugify } from "../src/lib/slug";
import { deriveBrandsFromProducts } from "../src/lib/catalog/migrationDocs";
import type { Brand } from "../src/types/brand";
import type { CatalogProduct } from "../src/types/catalog";
import categoriesData from "../src/data/catalog/categories.json";

const ROOT = process.cwd();
const IMAGES_ROOT = join(ROOT, "Vibe images", "with image - Copy");
const HERTZ_XLSX = join(ROOT, "HERTZ 27 MAY.xlsx");
const FULL_XLSX = join(ROOT, "Vibe_Music_Full_Catalog.xlsx");
const OVERRIDES_PATH = join(ROOT, "scripts", "catalog-import-overrides.json");
const PRICES_PATH = join(ROOT, "scripts", "catalog-prices.csv");
const MANIFEST_PATH = join(ROOT, "catalog-import-manifest.json");
const CATALOG_DIR = join(ROOT, "src", "data", "catalog");
const PRODUCTS_PATH = join(CATALOG_DIR, "products.json");
const BRANDS_PATH = join(CATALOG_DIR, "brands.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MATCH_THRESHOLD = 72;

const dryRun = process.argv.includes("--dry-run");
const doUpload = process.argv.includes("--upload") || process.argv.includes("--confirm");
const doConfirm = process.argv.includes("--confirm");
const replaceImages = process.argv.includes("--replace-images");
const updatePricesOnly = process.argv.includes("--update-prices");

interface OverridesFile {
  folderMerges?: Record<string, Record<string, string[]>>;
  folderToModel?: Record<string, Record<string, string>>;
  exactModelByFolder?: Record<string, Record<string, string>>;
  brandAliases?: Record<string, string[]>;
  sheetByBrandFolder?: Record<string, string | null>;
}

interface ExcelRow {
  brand: string;
  model: string;
  productType: string;
  color: string;
  title: string;
  bullets: string[];
  keywords: string;
  description: string;
  instrument: string;
  source: string;
  sheet: string;
}

interface FolderInventory {
  brandFolder: string;
  mergeKey: string;
  folderNames: string[];
  imagePaths: string[];
}

interface ManifestEntry {
  brandFolder: string;
  folderNames: string[];
  matchedModel: string;
  matchScore: number;
  matchSource: string;
  imageCount: number;
  heroFile: string;
  productSlug: string;
  categorySlug: string;
  status: "matched" | "unmatched" | "ambiguous";
  issues: string[];
}

interface PriceRow {
  model: string;
  price: number;
  stock: number;
  sku?: string;
}

function loadOverrides(): OverridesFile {
  if (!existsSync(OVERRIDES_PATH)) return {};
  return JSON.parse(readFileSync(OVERRIDES_PATH, "utf8")) as OverridesFile;
}

function normalizeBrandName(brand: string): string {
  const trimmed = brand.trim();
  if (trimmed.toUpperCase() === "ROLANDD") return "Roland";
  return trimmed.replace(/\s+/g, " ");
}

function normalizeKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isUsableImage(filePath: string): boolean {
  const name = basename(filePath);
  if (name.startsWith("._") || name.startsWith(".")) return false;
  return IMAGE_EXT.has(extname(name).toLowerCase());
}

function collectImages(dir: string): string[] {
  const results: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (isUsableImage(full)) {
        results.push(full);
      }
    }
  };
  walk(dir);
  return results.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function inventoryFolders(overrides: OverridesFile): FolderInventory[] {
  if (!existsSync(IMAGES_ROOT)) {
    throw new Error(`Image root not found: ${IMAGES_ROOT}`);
  }

  const merges = overrides.folderMerges ?? {};
  const folderToModel = overrides.folderToModel ?? {};
  const byKey = new Map<string, FolderInventory>();

  for (const brandEntry of readdirSync(IMAGES_ROOT)) {
    const brandPath = join(IMAGES_ROOT, brandEntry);
    if (!statSync(brandPath).isDirectory()) continue;

    const brandMerges = merges[brandEntry] ?? {};
    const reverseMerge = new Map<string, string>();
    for (const [mergeKey, folders] of Object.entries(brandMerges)) {
      for (const folder of folders) reverseMerge.set(folder, mergeKey);
    }

    for (const folderEntry of readdirSync(brandPath)) {
      const folderPath = join(brandPath, folderEntry);
      if (!statSync(folderPath).isDirectory()) continue;

      const mergeKey =
        reverseMerge.get(folderEntry) ??
        folderToModel[brandEntry]?.[folderEntry] ??
        folderEntry;
      const key = `${brandEntry}::${normalizeKey(mergeKey)}`;
      const images = collectImages(folderPath);

      const existing = byKey.get(key);
      if (existing) {
        existing.folderNames.push(folderEntry);
        existing.imagePaths.push(...images);
        existing.imagePaths.sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );
      } else {
        byKey.set(key, {
          brandFolder: brandEntry,
          mergeKey,
          folderNames: [folderEntry],
          imagePaths: images,
        });
      }
    }
  }

  return Array.from(byKey.values());
}

function parseHertzWorkbook(): ExcelRow[] {
  if (!existsSync(HERTZ_XLSX)) {
    throw new Error(`Missing ${HERTZ_XLSX}`);
  }
  const wb = XLSX.readFile(HERTZ_XLSX);
  const rows: ExcelRow[] = [];

  for (const sheetName of wb.SheetNames) {
    if (sheetName === "Sheet2" || sheetName === "DW1") continue;
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    if (!data.length) continue;

    for (let i = 1; i < data.length; i += 1) {
      const row = data[i];
      if (!row?.length) continue;
      const brand = String(row[0] ?? "").trim();
      const model = String(row[1] ?? "").trim();
      if (!brand && !model) continue;
      if (!model) continue;
      if (/MIXER|DRUM STICK|PERCUSSION/i.test(brand) && !model) continue;

      rows.push({
        brand: brand.replace(/\s+/g, " ").trim(),
        model,
        productType: String(row[2] ?? "").trim(),
        color: String(row[3] ?? "").trim(),
        title: String(row[4] ?? "").trim(),
        bullets: row.slice(5, 10).map((v) => String(v ?? "").trim()).filter(Boolean),
        keywords: String(row[10] ?? "").trim(),
        description: String(row[11] ?? "").trim(),
        instrument: String(row[12] ?? "").trim(),
        source: "hertz",
        sheet: sheetName,
      });
    }
  }

  return rows;
}

function parseFullCatalogWorkbook(): ExcelRow[] {
  if (!existsSync(FULL_XLSX)) {
    throw new Error(`Missing ${FULL_XLSX}`);
  }
  const wb = XLSX.readFile(FULL_XLSX);
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
  const rows: ExcelRow[] = [];

  for (let i = 1; i < data.length; i += 1) {
    const row = data[i];
    if (!row?.length) continue;
    const brand = String(row[0] ?? "").trim();
    const model = String(row[1] ?? "").trim();
    if (!brand || !model) continue;

    rows.push({
      brand,
      model,
      productType: String(row[2] ?? "").trim(),
      color: "",
      title: String(row[4] ?? "").trim(),
      bullets: row.slice(5, 10).map((v) => String(v ?? "").trim()).filter(Boolean),
      keywords: "",
      description: String(row[10] ?? "").trim(),
      instrument: "",
      source: "full",
      sheet: "Full Catalog Content",
    });
  }

  return rows;
}

function scoreMatch(folderKey: string, modelKey: string): number {
  if (!folderKey || !modelKey) return 0;
  if (folderKey === modelKey) return 100;
  if (folderKey.includes(modelKey) || modelKey.includes(folderKey)) {
    const ratio = Math.min(folderKey.length, modelKey.length) / Math.max(folderKey.length, modelKey.length);
    return 80 + ratio * 15;
  }

  const a = folderKey;
  const b = modelKey;
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i += 1) matrix[i]![0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0]![j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      );
    }
  }
  const distance = matrix[a.length]![b.length]!;
  const maxLen = Math.max(a.length, b.length);
  return Math.round((1 - distance / maxLen) * 100);
}

function brandMatches(folderBrand: string, rowBrand: string, overrides: OverridesFile): boolean {
  const aliases = overrides.brandAliases?.[folderBrand] ?? [folderBrand];
  const rowKey = normalizeKey(rowBrand);
  return aliases.some((alias) => {
    const aliasKey = normalizeKey(alias);
    return rowKey.includes(aliasKey) || aliasKey.includes(rowKey);
  });
}

function getExplicitModelTarget(
  folder: FolderInventory,
  overrides: OverridesFile
): string | null {
  const exact =
    overrides.exactModelByFolder?.[folder.brandFolder]?.[folder.mergeKey] ??
    overrides.exactModelByFolder?.[folder.brandFolder]?.[folder.folderNames[0]!];
  if (exact) return exact;

  return (
    overrides.folderToModel?.[folder.brandFolder]?.[folder.mergeKey] ??
    overrides.folderToModel?.[folder.brandFolder]?.[folder.folderNames[0]!] ??
    null
  );
}

function findRowByExplicitModel(
  targetModel: string,
  hertzRows: ExcelRow[],
  fullRows: ExcelRow[]
): { row: ExcelRow | null; score: number; ambiguous: boolean } {
  const targetKey = normalizeKey(targetModel);
  const pools = [...hertzRows, ...fullRows];
  const candidates: Array<{ row: ExcelRow; score: number }> = [];

  for (const row of pools) {
    const modelKey = normalizeKey(row.model);
    let score = scoreMatch(targetKey, modelKey);
    if (modelKey === targetKey) score = 100;
    if (modelKey.includes(targetKey) || targetKey.includes(modelKey)) {
      score = Math.max(score, 92);
    }
    if (normalizeKey(`${row.brand} ${row.model}`).includes(targetKey)) {
      score = Math.max(score, 95);
    }
    if (row.model.trim() === targetModel.trim()) score = 100;
    if (score >= MATCH_THRESHOLD) candidates.push({ row, score });
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.row.source !== b.row.source) {
      return a.row.source === "hertz" ? -1 : 1;
    }
    const aExact = normalizeKey(a.row.model) === targetKey ? 1 : 0;
    const bExact = normalizeKey(b.row.model) === targetKey ? 1 : 0;
    if (bExact !== aExact) return bExact - aExact;
    return a.row.model.length - b.row.model.length;
  });

  if (!candidates.length) return { row: null, score: 0, ambiguous: false };
  if (candidates.length > 1 && candidates[0]!.score === candidates[1]!.score) {
    const topKey = normalizeKey(candidates[0]!.row.model);
    const secondKey = normalizeKey(candidates[1]!.row.model);
    if (topKey === secondKey) {
      return { row: candidates[0]!.row, score: candidates[0]!.score, ambiguous: false };
    }
    const exact = candidates.find((c) => normalizeKey(c.row.model) === targetKey);
    if (exact) {
      return { row: exact.row, score: exact.score, ambiguous: false };
    }
    return { row: null, score: candidates[0]!.score, ambiguous: true };
  }
  return { row: candidates[0]!.row, score: candidates[0]!.score, ambiguous: false };
}

function findBestRow(
  folder: FolderInventory,
  hertzRows: ExcelRow[],
  fullRows: ExcelRow[],
  overrides: OverridesFile
): { row: ExcelRow | null; score: number; ambiguous: boolean } {
  const explicitModel = getExplicitModelTarget(folder, overrides);
  if (explicitModel) {
    return findRowByExplicitModel(explicitModel, hertzRows, fullRows);
  }

  const folderKey = normalizeKey(folder.mergeKey);
  const sheetName = overrides.sheetByBrandFolder?.[folder.brandFolder];

  const candidates: Array<{ row: ExcelRow; score: number }> = [];
  const pools: ExcelRow[] = [];

  if (sheetName) {
    pools.push(...hertzRows.filter((r) => r.sheet === sheetName));
  } else {
    pools.push(...fullRows);
  }
  pools.push(...fullRows);

  const seen = new Set<ExcelRow>();
  for (const row of pools) {
    if (seen.has(row)) continue;
    seen.add(row);
    if (!brandMatches(folder.brandFolder, row.brand, overrides)) continue;
    const modelKey = normalizeKey(row.model);
    const score = scoreMatch(folderKey, modelKey);
    if (score >= MATCH_THRESHOLD) candidates.push({ row, score });
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.row.source !== b.row.source) {
      return a.row.source === "hertz" ? -1 : 1;
    }
    return 0;
  });
  if (!candidates.length) return { row: null, score: 0, ambiguous: false };
  if (candidates.length > 1 && candidates[0]!.score === candidates[1]!.score) {
    return { row: null, score: candidates[0]!.score, ambiguous: true };
  }
  return { row: candidates[0]!.row, score: candidates[0]!.score, ambiguous: false };
}

function mapCategorySlug(productType: string, instrument: string): string {
  const text = `${productType} ${instrument}`.toLowerCase();
  if (/bass\s*guitar|\bbass\b/.test(text)) return "bass";
  if (/guitar/.test(text) && !/wireless/.test(text)) return "guitars";
  if (/drumstick|percussion|cymbal|drum/.test(text)) return "drums-percussion";
  if (/keyboard|synthesizer|roland ex|digital piano/.test(text)) return "keyboards-synthesizers";
  if (/wireless|microphone|mic\b/.test(text)) return "microphones-wireless";
  if (/mixer|pa\b|live sound|amplifier|speaker/.test(text)) return "live-sound-lighting";
  if (/dj/.test(text)) return "dj-equipment";
  if (/studio|recording|interface/.test(text)) return "studio-recording";
  return "home-audio-electronics";
}

function categoryNameFromSlug(slug: string): string {
  const cat = categoriesData.find((c) => c.slug === slug);
  return cat?.name ?? "Home Audio & Electronics";
}

function selectHeroImage(paths: string[]): string {
  const eligible = paths.filter(isWithinUploadLimit);
  const pool = eligible.length ? eligible : paths;
  const scored = pool.map((p) => {
    const name = basename(p).toUpperCase();
    let score = 0;
    if (/FRONT|FRNT|FRT|MAIN/.test(name)) score += 50;
    if (extname(p).toLowerCase() === ".png") score += 10;
    if (/BACK|BCK|SIDE/.test(name)) score -= 20;
    return { path: p, score, name };
  });
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored[0]?.path ?? paths[0]!;
}

function orderGalleryImages(paths: string[], hero: string): string[] {
  const rest = paths.filter((p) => p !== hero);
  return [hero, ...rest];
}

function buildDescription(row: ExcelRow): string {
  const parts = [row.description, ...row.bullets.filter(Boolean)];
  return parts.join("\n\n").trim();
}

function buildSku(model: string): string {
  const key = normalizeKey(model).slice(0, 24) || "SKU";
  return `VM-${key}`;
}

function loadPrices(): Map<string, PriceRow> {
  const map = new Map<string, PriceRow>();
  if (!existsSync(PRICES_PATH)) return map;

  const text = readFileSync(PRICES_PATH, "utf8").trim();
  if (!text) return map;

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const modelIdx = headers.indexOf("model");
  const priceIdx = headers.indexOf("price");
  const stockIdx = headers.indexOf("stock");
  const skuIdx = headers.indexOf("sku");

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith("#")) continue;
    const cols = line.split(",").map((c) => c.trim());
    const model = cols[modelIdx];
    if (!model) continue;
    map.set(normalizeKey(model), {
      model,
      price: Number(cols[priceIdx] ?? 0),
      stock: Number(cols[stockIdx] ?? 0),
      sku: skuIdx >= 0 ? cols[skuIdx] : undefined,
    });
  }
  return map;
}

function configureCloudinary(): void {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  }
  if (!process.env.CLOUDINARY_API_KEY) missing.push("CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_API_SECRET) missing.push("CLOUDINARY_API_SECRET");
  if (missing.length) {
    throw new Error(`Missing Cloudinary env: ${missing.join(", ")}`);
  }
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const COMPRESS_THRESHOLD_BYTES = 4 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 8;
const UPLOAD_RETRIES = 3;

function isWithinUploadLimit(filePath: string): boolean {
  return statSync(filePath).size <= MAX_UPLOAD_BYTES;
}

async function prepareUploadBuffer(
  filePath: string
): Promise<{ buffer: Buffer; resourceExt: string }> {
  const stats = statSync(filePath);
  const ext = extname(filePath).toLowerCase();

  if (stats.size <= COMPRESS_THRESHOLD_BYTES) {
    return { buffer: readFileSync(filePath), resourceExt: ext };
  }

  const buffer = await sharp(filePath)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  return { buffer, resourceExt: ".jpg" };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadImage(
  filePath: string,
  folder: string,
  publicId: string
): Promise<string | null> {
  configureCloudinary();
  const { buffer } = await prepareUploadBuffer(filePath);
  const options = {
    folder,
    public_id: publicId,
    resource_type: "image" as const,
    overwrite: replaceImages,
    unique_filename: !replaceImages,
  };

  for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error || !result?.secure_url) {
              reject(error ?? new Error(`Upload failed for ${filePath}`));
              return;
            }
            resolve(result.secure_url);
          }
        );
        stream.end(buffer);
      });
      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === UPLOAD_RETRIES) {
        console.warn(`Skipped image ${basename(filePath)}: ${message}`);
        return null;
      }
      await sleep(attempt * 2000);
    }
  }

  return null;
}

function buildManifest(
  folders: FolderInventory[],
  hertzRows: ExcelRow[],
  fullRows: ExcelRow[],
  overrides: OverridesFile
): ManifestEntry[] {
  return folders.map((folder) => {
    const issues: string[] = [];
    if (!folder.imagePaths.length) issues.push("No usable images");

    const { row, score, ambiguous } = findBestRow(folder, hertzRows, fullRows, overrides);
    let status: ManifestEntry["status"] = "matched";
    if (ambiguous) {
      status = "ambiguous";
      issues.push("Multiple Excel rows matched with equal score");
    } else if (!row) {
      status = "unmatched";
      issues.push("No Excel row matched");
    }

    const brand = row?.brand ? normalizeBrandName(row.brand) : folder.brandFolder;
    const model = row?.model ?? folder.mergeKey;
    const categorySlug = row
      ? mapCategorySlug(row.productType, row.instrument)
      : "home-audio-electronics";
    const productSlug = slugify(`${brand}-${model}-${folder.mergeKey}`);
    const hero = folder.imagePaths.length ? selectHeroImage(folder.imagePaths) : "";

    return {
      brandFolder: folder.brandFolder,
      folderNames: folder.folderNames,
      matchedModel: model,
      matchScore: score,
      matchSource: row ? `${row.source}:${row.sheet}` : "",
      imageCount: folder.imagePaths.length,
      heroFile: hero ? basename(hero) : "",
      productSlug,
      categorySlug,
      status,
      issues,
    };
  });
}

async function buildProducts(
  folders: FolderInventory[],
  hertzRows: ExcelRow[],
  fullRows: ExcelRow[],
  overrides: OverridesFile,
  prices: Map<string, PriceRow>
): Promise<CatalogProduct[]> {
  const now = new Date().toISOString();
  const products: CatalogProduct[] = [];

  for (const folder of folders) {
    const { row, ambiguous } = findBestRow(folder, hertzRows, fullRows, overrides);
    if (!row || ambiguous || !folder.imagePaths.length) continue;

    const brand = normalizeBrandName(row.brand) || folder.brandFolder;
    const brandSlug = slugify(brand);
    const categorySlug = mapCategorySlug(row.productType, row.instrument);
    const categoryName = categoryNameFromSlug(categorySlug);
    const productSlug = slugify(`${brand}-${row.model}-${folder.mergeKey}`);
    const priceEntry = prices.get(normalizeKey(row.model));
    const sku = priceEntry?.sku?.trim() || buildSku(row.model);
    const price = priceEntry?.price ?? 0;
    const stock = priceEntry?.stock ?? 0;
    const status = price > 0 && stock > 0 ? "active" : "draft";

    const heroPath = selectHeroImage(folder.imagePaths);
    const galleryPaths = orderGalleryImages(folder.imagePaths, heroPath).slice(
      0,
      MAX_GALLERY_IMAGES
    );
    const cloudFolder = `products/${categorySlug}/${productSlug}`;
    const imageUrls: string[] = [];

    if (doUpload && !dryRun) {
      configureCloudinary();
      for (let i = 0; i < galleryPaths.length; i += 1) {
        const imagePath = galleryPaths[i]!;
        const suffix = String(i + 1).padStart(2, "0");
        try {
          const url = await uploadImage(
            imagePath,
            cloudFolder,
            `${suffix}-${slugify(basename(imagePath, extname(imagePath)))}`
          );
          if (url) imageUrls.push(url);
        } catch (error) {
          console.warn(
            `Skipped image ${basename(imagePath)}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
      if (!imageUrls.length) {
        throw new Error(`No images uploaded for ${productSlug}`);
      }
    } else {
      for (let i = 0; i < galleryPaths.length; i += 1) {
        imageUrls.push(`pending://${cloudFolder}/${i + 1}`);
      }
    }

    const name = row.title || `${brand} ${row.model}`;
    const description = buildDescription(row);
    const specifications: Record<string, string> = {
      Manufacturer: brand,
      Category: categoryName,
      SKU: sku,
      Model: row.model,
    };
    if (row.productType) specifications["Product Type"] = row.productType;
    if (row.instrument.trim()) specifications.Instrument = row.instrument.trim();
    if (row.color) specifications.Color = row.color;
    if (row.keywords) specifications.Keywords = row.keywords;

    const product: CatalogProduct = {
      id: `prod-${productSlug}`,
      slug: productSlug,
      name,
      brand,
      category: categoryName,
      subcategory: row.productType,
      price,
      originalPrice: price,
      discountPercentage: 0,
      rating: 0,
      reviewCount: 0,
      stock,
      reservedStock: 0,
      lowStockThreshold: 10,
      sku,
      status,
      featured: false,
      trending: false,
      newArrival: true,
      images: imageUrls,
      description,
      specifications,
      createdAt: now,
      updatedAt: now,
      brandSlug,
      categorySlug,
      availability: stock > 0 ? "in-stock" : "out-of-stock",
      condition: "new",
      imageColor: "#e8e8e8",
      image: imageUrls[0]!,
      gstRate: 18,
      detail: {
        msrp: price > 0 ? price : null,
        salePrice: null,
        specs: Object.entries(specifications).map(([label, value]) => ({ label, value })),
        inTheBox: [`${brand} ${row.model}`, "Manufacturer documentation"],
        gallery: imageUrls.map((src, index) => ({
          id: `img-${index}`,
          alt: `${name} view ${index + 1}`,
          color: "#e8e8e8",
          src,
        })),
        videos: [],
        variants: [
          {
            id: "var-default",
            label: "Standard",
            sku,
            price: price > 0 ? price : 0,
            stock,
            availability: stock > 0 ? "in-stock" : "out-of-stock",
            attributes: [],
            images: imageUrls,
            isDefault: true,
          },
        ],
        reviews: [],
        qa: [],
        frequentlyBoughtTogether: [],
        similarProductIds: [],
        relatedProductIds: [],
      },
    };

    products.push(product);
  }

  products.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
  return products;
}

function applyPriceUpdates(products: CatalogProduct[], prices: Map<string, PriceRow>): CatalogProduct[] {
  const now = new Date().toISOString();
  return products.map((product) => {
    const modelKey = normalizeKey(product.specifications.Model ?? product.name);
    const priceEntry = [...prices.values()].find(
      (p) => modelKey.includes(normalizeKey(p.model)) || normalizeKey(p.model).includes(modelKey)
    );
    if (!priceEntry || priceEntry.price <= 0) return product;

    const stock = priceEntry.stock;
    return {
      ...product,
      price: priceEntry.price,
      originalPrice: priceEntry.price,
      stock,
      sku: priceEntry.sku?.trim() || product.sku,
      status: stock > 0 ? "active" : product.status,
      availability: stock > 0 ? "in-stock" : "out-of-stock",
      updatedAt: now,
      detail: product.detail
        ? {
            ...product.detail,
            msrp: priceEntry.price,
            variants: product.detail.variants.map((v) => ({
              ...v,
              price: priceEntry.price,
              sku: priceEntry.sku?.trim() || v.sku,
              availability: stock > 0 ? "in-stock" : "out-of-stock",
            })),
          }
        : product.detail,
    };
  });
}

function writeCatalog(products: CatalogProduct[]): void {
  const brands: Brand[] = deriveBrandsFromProducts(products);
  mkdirSync(CATALOG_DIR, { recursive: true });
  writeFileSync(PRODUCTS_PATH, `${JSON.stringify(products, null, 2)}\n`);
  writeFileSync(BRANDS_PATH, `${JSON.stringify(brands, null, 2)}\n`);
}

function runMigrate(): void {
  const result = spawnSync(
    "npm",
    ["run", "migrate:catalog", "--", ...(dryRun ? ["--dry-run"] : ["--replace"])],
    { cwd: ROOT, stdio: "inherit", shell: true }
  );
  if (result.status !== 0) {
    throw new Error("migrate:catalog failed");
  }
}

async function main(): Promise<void> {
  const overrides = loadOverrides();
  const prices = loadPrices();
  const folders = inventoryFolders(overrides);
  const hertzRows = parseHertzWorkbook();
  const fullRows = parseFullCatalogWorkbook();
  const manifest = buildManifest(folders, hertzRows, fullRows, overrides);

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  const unmatched = manifest.filter((m) => m.status === "unmatched");
  const ambiguous = manifest.filter((m) => m.status === "ambiguous");
  const noImages = manifest.filter((m) => m.imageCount === 0);

  console.log(`Folders inventoried: ${folders.length}`);
  console.log(`Excel rows: ${hertzRows.length} (HERTZ) + ${fullRows.length} (Full)`);
  console.log(`Matched: ${manifest.filter((m) => m.status === "matched").length}`);
  console.log(`Unmatched: ${unmatched.length}`);
  console.log(`Ambiguous: ${ambiguous.length}`);
  console.log(`No images: ${noImages.length}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);

  if (unmatched.length || ambiguous.length || noImages.length) {
    console.error("\nImport blocked — fix manifest issues before uploading.");
    if (unmatched.length) {
      console.error("Unmatched:", unmatched.map((m) => m.folderNames.join(" + ")).join("; "));
    }
    if (ambiguous.length) {
      console.error("Ambiguous:", ambiguous.map((m) => m.folderNames.join(" + ")).join("; "));
    }
    process.exit(1);
  }

  if (updatePricesOnly) {
    if (!existsSync(PRODUCTS_PATH)) {
      throw new Error("products.json not found — run import with --upload first");
    }
    const existing = JSON.parse(readFileSync(PRODUCTS_PATH, "utf8")) as CatalogProduct[];
    const updated = applyPriceUpdates(existing, prices);
    writeCatalog(updated);
    console.log(`Updated prices on ${updated.filter((p) => p.status === "active").length} active products`);
    if (doConfirm) runMigrate();
    return;
  }

  if (!doUpload) {
    console.log("\nDry run complete. Re-run with --upload or --confirm to write catalog.");
    return;
  }

  const products = await buildProducts(folders, hertzRows, fullRows, overrides, prices);
  if (!dryRun) {
    writeCatalog(products);
    console.log(`Wrote ${products.length} products to ${PRODUCTS_PATH}`);
  }

  if (doConfirm && !dryRun) {
    runMigrate();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
