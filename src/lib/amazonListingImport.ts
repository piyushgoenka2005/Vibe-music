/**
 * Canonical Vibe Music bulk product import format.
 * Headers must match `public/vibemusic bulk.csv` exactly.
 */
import * as XLSX from "xlsx";
import { rowsToCsv } from "@/lib/csv";
import type { BulkImportRow } from "@/types/catalog";
import type { ProductSpec } from "@/types/product";
import { isGenericBulkCategoryValue } from "@/lib/admin/bulkImportCategoryResolver";

/** Exact header order from `public/vibemusic bulk.csv`. */
export const AMAZON_LISTING_HEADERS = [
  "Brand",
  "SKU",
  "MODEL NO.",
  "ITEM TITLE",
  "Product Description",
  "PRODUCT TYPE",
  "Category",
  "Product Category",
  "Product Subcategory",
  "Browse Node",
  "MRP",
  "Selling Price",
  "Model Name",
  "Model Number",
  "Manufacturer",
  "Model Year",
  "Warranty",
  "ASIN",
  "UPC",
  "Bullet Point",
  "Bullet Point.1",
  "Bullet Point.2",
  "Bullet Point.3",
  "Bullet Point.4",
  "Generic Keyword",
  "Generic Keyword.1",
  "Generic Keyword.2",
  "Special Features",
  "Style",
  "Age Range Description",
  "Item Type Name",
  "Color",
  "Size",
  "Part Number",
  "Number of Keys",
  "MANUFACTURER CONTACT INFORMATION",
  "Power Source",
  "Connectivity Technology",
  "Connector Type",
  "Skill Level",
  "Headphones Jack",
  "Finish Type",
  "Unit Count",
  "Unit Count Type",
  "Instrument",
  "Importer Contact Information",
  "Packer Contact Information",
  "Item  Depth Front to Back",
  "Item  Depth Unit",
  "Height Top to Bottom",
  "Item Height Unit",
  "Item  Width Side to Side",
  "Item Width Unit",
  "Maximum Retail Price (MRP)",
  "Item Package Length",
  "Package Length Unit",
  "Item Package Width",
  "Package Width Unit",
  "Item Package Height",
  "Package Height Unit",
  "Package Weight",
  "Package Weight Unit",
  "Number of Boxes",
  "Warranty Description",
  "Are batteries required?",
  "Are batteries included?",
  "Dangerous Goods Regulations",
  "Item Weight",
  "Item Weight Unit",
] as const;

/** Alias — same columns as `public/vibemusic bulk.csv`. */
export const VIBEMUSIC_BULK_HEADERS = AMAZON_LISTING_HEADERS;

export type AmazonListingHeader = (typeof AMAZON_LISTING_HEADERS)[number];
export type VibemusicBulkHeader = AmazonListingHeader;

export const VIBEMUSIC_BULK_COLUMN_COUNT = AMAZON_LISTING_HEADERS.length;

const VIBEMUSIC_BULK_SIGNATURE_HEADERS = [
  "ITEM TITLE",
  "Selling Price",
  "Brand",
  "SKU",
  "Category",
] as const;

/** @deprecated Prefer VIBEMUSIC_BULK_SIGNATURE_HEADERS */
export const AMAZON_SIGNATURE_HEADERS = VIBEMUSIC_BULK_SIGNATURE_HEADERS;

/** Spec labels written into catalog specifications / PDP detail specs. */
const SPEC_FIELD_MAP: Array<{ header: string; label: string }> = [
  { header: "MODEL NO.", label: "Model No." },
  { header: "Model Name", label: "Model Name" },
  { header: "Model Number", label: "Model Number" },
  { header: "Manufacturer", label: "Manufacturer" },
  { header: "Model Year", label: "Model Year" },
  { header: "Warranty", label: "Warranty" },
  { header: "Warranty Description", label: "Warranty Description" },
  { header: "ASIN", label: "ASIN" },
  { header: "UPC", label: "UPC" },
  { header: "Browse Node", label: "Browse Node" },
  { header: "PRODUCT TYPE", label: "Product Type" },
  { header: "Product Category", label: "Product Category" },
  { header: "Style", label: "Style" },
  { header: "Age Range Description", label: "Age Range" },
  { header: "Item Type Name", label: "Item Type" },
  { header: "Color", label: "Color" },
  { header: "Size", label: "Size" },
  { header: "Part Number", label: "Part Number" },
  { header: "Number of Keys", label: "Number of Keys" },
  { header: "Power Source", label: "Power Source" },
  { header: "Connectivity Technology", label: "Connectivity" },
  { header: "Connector Type", label: "Connector Type" },
  { header: "Skill Level", label: "Skill Level" },
  { header: "Headphones Jack", label: "Headphones Jack" },
  { header: "Finish Type", label: "Finish Type" },
  { header: "Unit Count", label: "Unit Count" },
  { header: "Unit Count Type", label: "Unit Count Type" },
  { header: "Instrument", label: "Instrument" },
  { header: "Are batteries required?", label: "Batteries Required" },
  { header: "Are batteries included?", label: "Batteries Included" },
  { header: "Dangerous Goods Regulations", label: "Dangerous Goods" },
  { header: "Number of Boxes", label: "Number of Boxes" },
  { header: "MANUFACTURER CONTACT INFORMATION", label: "Manufacturer Contact" },
  { header: "Importer Contact Information", label: "Importer Contact" },
  { header: "Packer Contact Information", label: "Packer Contact" },
];

export type ProductImportFormat = "vibemusic-bulk" | "legacy";

export interface ParsedProductImport {
  format: ProductImportFormat;
  headers: string[];
  rows: BulkImportRow[];
  totalRowsRead: number;
  emptyRowsSkipped: number;
}

function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildHeaderMap(keys: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of keys) {
    map.set(normalizeHeaderKey(key), key);
  }
  return map;
}

function getCell(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  ...candidates: string[]
): string {
  for (const candidate of candidates) {
    const actual = headerMap.get(normalizeHeaderKey(candidate));
    if (!actual) continue;
    const raw = row[actual];
    if (raw == null) continue;
    const value = String(raw).trim();
    if (value) return value;
  }
  return "";
}

function getCellsMatching(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  prefix: string,
): string[] {
  const normalizedPrefix = normalizeHeaderKey(prefix);
  const values: string[] = [];
  const seen = new Set<string>();

  for (const [normalized, actual] of headerMap) {
    if (normalized === normalizedPrefix || normalized.startsWith(normalizedPrefix)) {
      if (seen.has(actual)) continue;
      seen.add(actual);
      const value = String(row[actual] ?? "").trim();
      if (value) values.push(value);
    }
  }
  return values;
}

/** Parse INR / currency / comma-formatted prices from listing sheets. */
export function parseListingPrice(value: string | number | undefined | null): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const cleaned = String(value)
    .replace(/[₹$€£,\s]/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();
  if (!cleaned) return undefined;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

export function detectProductImportFormat(headers: string[]): ProductImportFormat {
  if (validateVibemusicBulkHeaders(headers) === null) return "vibemusic-bulk";
  const normalized = new Set(headers.map(normalizeHeaderKey));
  const bulkHits = VIBEMUSIC_BULK_SIGNATURE_HEADERS.filter((h) =>
    normalized.has(normalizeHeaderKey(h)),
  ).length;
  if (bulkHits >= 3) return "vibemusic-bulk";
  return "legacy";
}

function joinDimension(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  valueHeader: string,
  unitHeader: string,
): string {
  const value = getCell(row, headerMap, valueHeader);
  const unit = getCell(row, headerMap, unitHeader);
  if (!value) return "";
  return unit ? `${value} ${unit}` : value;
}

function splitFeatureList(raw: string): string[] {
  return raw
    .split(/[\n|;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildDescription(parts: { productDescription: string; bullets: string[] }): string {
  const lines: string[] = [];
  if (parts.productDescription) {
    // Keep multi-sentence prose as intro; store bullets as separate lines for PDP.
    const prose = parts.productDescription.replace(/\r\n/g, "\n").trim();
    if (prose.includes("\n")) {
      lines.push(
        ...prose
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      );
    } else {
      lines.push(prose);
    }
  }
  for (const bullet of parts.bullets) {
    if (!lines.includes(bullet)) lines.push(bullet);
  }
  return lines.join("\n");
}

const IMPORT_SPEC_SKIP_HEADERS = new Set(
  [
    "brand",
    "sku",
    "itemtitle",
    "productdescription",
    "sellingprice",
    "mrp",
    "maximumretailpricemrp",
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
    "mainimage",
    "bulletpoint",
    "generickeyword",
  ].map(normalizeHeaderKey),
);

function sanitizeImportSpecLabel(header: string): string {
  return header.replace(/\s+/g, " ").replace(/\.$/g, "").trim();
}

function mergeDynamicRowSpecifications(
  specs: Record<string, string>,
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
): Record<string, string> {
  const merged = { ...specs };
  const used = new Set(Object.keys(merged).map((label) => normalizeHeaderKey(label)));

  for (const [normalized, actual] of headerMap) {
    if (IMPORT_SPEC_SKIP_HEADERS.has(normalized)) continue;
    if (normalized.startsWith(normalizeHeaderKey("Bullet Point"))) continue;
    if (normalized.startsWith(normalizeHeaderKey("Generic Keyword"))) continue;
    if (normalized.startsWith("image")) continue;

    const raw = row[actual];
    if (raw == null) continue;
    const value = String(raw).trim();
    if (!value) continue;

    const label = sanitizeImportSpecLabel(actual);
    const labelKey = normalizeHeaderKey(label);
    if (used.has(labelKey)) continue;

    merged[label] = value;
    used.add(labelKey);
  }

  return merged;
}

function buildSpecifications(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  brand: string,
  sku: string,
): Record<string, string> {
  const specs: Record<string, string> = {};
  if (brand) specs.Manufacturer = brand;
  if (sku) specs.SKU = sku;

  for (const { header, label } of SPEC_FIELD_MAP) {
    const value = getCell(row, headerMap, header);
    if (value) specs[label] = value;
  }

  const keywords = getCellsMatching(row, headerMap, "Generic Keyword");
  if (keywords.length) {
    specs["Search Keywords"] = keywords.join(", ");
  }

  const depth = joinDimension(row, headerMap, "Item  Depth Front to Back", "Item  Depth Unit");
  if (depth) specs["Item Depth"] = depth;

  const height = joinDimension(row, headerMap, "Height Top to Bottom", "Item Height Unit");
  if (height) specs["Item Height"] = height;

  const width = joinDimension(row, headerMap, "Item  Width Side to Side", "Item Width Unit");
  if (width) specs["Item Width"] = width;

  const itemWeight = joinDimension(row, headerMap, "Item Weight", "Item Weight Unit");
  if (itemWeight) specs["Item Weight"] = itemWeight;

  const pkgLength = joinDimension(row, headerMap, "Item Package Length", "Package Length Unit");
  if (pkgLength) specs["Package Length"] = pkgLength;

  const pkgWidth = joinDimension(row, headerMap, "Item Package Width", "Package Width Unit");
  if (pkgWidth) specs["Package Width"] = pkgWidth;

  const pkgHeight = joinDimension(row, headerMap, "Item Package Height", "Package Height Unit");
  if (pkgHeight) specs["Package Height"] = pkgHeight;

  const pkgWeight = joinDimension(row, headerMap, "Package Weight", "Package Weight Unit");
  if (pkgWeight) specs["Package Weight"] = pkgWeight;

  const category =
    getCell(row, headerMap, "Category") || getCell(row, headerMap, "Product Category");
  if (category) specs.Category = category;

  const subcategory = getCell(row, headerMap, "Product Subcategory");
  if (subcategory) specs.Subcategory = subcategory;

  const specialFeatures = splitFeatureList(getCell(row, headerMap, "Special Features"));
  if (specialFeatures.length) {
    specs["Special Features"] = specialFeatures.join("; ");
  }

  return mergeDynamicRowSpecifications(specs, row, headerMap);
}

function specsToDetailSpecs(specifications: Record<string, string>): ProductSpec[] {
  return Object.entries(specifications)
    .filter(([label]) => label !== "Search Keywords")
    .map(([label, value]) => ({ label, value }));
}

function pickBulkImportCategoryFields(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
): { category: string; subcategory: string } {
  const subcategory = getCell(row, headerMap, "Product Subcategory");
  const candidates = [
    subcategory,
    getCell(row, headerMap, "Product Category"),
    getCell(row, headerMap, "PRODUCT TYPE"),
    getCell(row, headerMap, "Instrument"),
    getCell(row, headerMap, "Browse Node"),
    getCell(row, headerMap, "Category"),
  ].filter(Boolean);

  const specific = candidates.find((value) => !isGenericBulkCategoryValue(value));
  const category = specific ?? candidates[candidates.length - 1] ?? "";
  return { category, subcategory };
}

export function amazonRowToImportRow(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
): BulkImportRow | null {
  const brand = getCell(row, headerMap, "Brand");
  const sku = getCell(row, headerMap, "SKU");
  const name = getCell(row, headerMap, "ITEM TITLE", "Item Title", "Title");
  const productDescription = getCell(row, headerMap, "Product Description");

  // Skip blank template padding rows (workbook often has 1000 empty rows).
  if (!brand && !sku && !name && !productDescription) {
    return null;
  }

  const { category: categoryLabel, subcategory } = pickBulkImportCategoryFields(row, headerMap);

  const sellingPriceCell = parseListingPrice(getCell(row, headerMap, "Selling Price"));
  const mrpCell = parseListingPrice(
    getCell(row, headerMap, "MRP") || getCell(row, headerMap, "Maximum Retail Price (MRP)"),
  );
  const sellingPrice = sellingPriceCell ?? mrpCell;
  const mrp = mrpCell ?? sellingPriceCell;
  const priceFromMrpFallback = sellingPriceCell == null && mrpCell != null;

  const bullets = getCellsMatching(row, headerMap, "Bullet Point");
  const specialFeatures = splitFeatureList(getCell(row, headerMap, "Special Features"));

  const specifications = buildSpecifications(row, headerMap, brand, sku);
  const description = buildDescription({ productDescription, bullets });

  const image1 = getCell(row, headerMap, "image1", "Image 1", "Main Image");
  const image2 = getCell(row, headerMap, "image2", "Image 2");
  const image3 = getCell(row, headerMap, "image3", "Image 3");
  const image4 = getCell(row, headerMap, "image4", "Image 4");
  const image5 = getCell(row, headerMap, "image5", "Image 5");

  return {
    name,
    brand,
    category: categoryLabel,
    subcategory,
    price: sellingPrice ?? Number.NaN,
    originalPrice: mrp,
    priceFromMrpFallback,
    stock: 0,
    sku,
    description,
    featured: false,
    trending: false,
    newArrival: false,
    image1: image1 || undefined,
    image2: image2 || undefined,
    image3: image3 || undefined,
    image4: image4 || undefined,
    image5: image5 || undefined,
    specifications,
    detailSpecs: specsToDetailSpecs(specifications),
    inTheBox: specialFeatures.length ? specialFeatures : bullets.slice(0, 8),
    keywords: getCellsMatching(row, headerMap, "Generic Keyword"),
    sourceFormat: "vibemusic-bulk",
  };
}

export const vibemusicBulkRowToImportRow = amazonRowToImportRow;

function legacyRowToImportRow(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
): BulkImportRow | null {
  const name = getCell(row, headerMap, "name", "ITEM TITLE");
  const brand = getCell(row, headerMap, "brand", "Brand");
  const category = getCell(row, headerMap, "category", "Category");
  if (!name && !brand && !category) return null;

  const sellingPrice = parseListingPrice(
    getCell(row, headerMap, "sellingPrice", "Selling Price", "price"),
  );
  const mrp = parseListingPrice(getCell(row, headerMap, "mrp", "MRP", "originalPrice"));
  const stockRaw = getCell(row, headerMap, "stock");

  return {
    name,
    brand,
    category,
    subcategory: getCell(row, headerMap, "subcategory", "Product Subcategory"),
    price: sellingPrice ?? Number.NaN,
    originalPrice: mrp,
    stock: stockRaw ? Number(stockRaw) : undefined,
    sku: getCell(row, headerMap, "sku", "SKU"),
    description: getCell(row, headerMap, "description", "Product Description"),
    featured: getCell(row, headerMap, "featured"),
    trending: getCell(row, headerMap, "trending"),
    newArrival: getCell(row, headerMap, "newArrival"),
    image1: getCell(row, headerMap, "image1") || undefined,
    image2: getCell(row, headerMap, "image2") || undefined,
    image3: getCell(row, headerMap, "image3") || undefined,
    image4: getCell(row, headerMap, "image4") || undefined,
    image5: getCell(row, headerMap, "image5") || undefined,
    sourceFormat: "legacy",
  };
}

/**
 * Parse CSV or Excel (.xlsx / .xls) product listing upload into BulkImportRows.
 */
export function parseProductImportBuffer(
  buffer: Buffer,
  _filename = "upload.xlsx",
): ParsedProductImport {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The uploaded file does not contain any sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) {
    throw new Error("The sheet contains no header row.");
  }

  const headerRow = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim());
  const headers = headerRow.filter(Boolean);
  if (headers.length === 0) {
    throw new Error("The sheet header row is empty.");
  }

  const format = detectProductImportFormat(headers);
  const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rawJson.length === 0) {
    throw new Error(
      "The sheet contains no data rows. Fill at least one product row under the Vibe Music bulk template headers.",
    );
  }

  const headerMap = buildHeaderMap(
    Object.keys(
      rawJson[0] ??
        headers.reduce(
          (acc, h) => {
            acc[h] = "";
            return acc;
          },
          {} as Record<string, string>,
        ),
    ),
  );

  // Prefer original header spellings from the file when available.
  for (const header of headers) {
    headerMap.set(normalizeHeaderKey(header), header);
  }

  const rows: BulkImportRow[] = [];
  let emptyRowsSkipped = 0;

  for (const raw of rawJson) {
    const mapped =
      format === "vibemusic-bulk"
        ? amazonRowToImportRow(raw, headerMap)
        : legacyRowToImportRow(raw, headerMap);

    if (!mapped) {
      emptyRowsSkipped += 1;
      continue;
    }
    rows.push(mapped);
  }

  if (rows.length === 0) {
    throw new Error(
      format === "vibemusic-bulk"
        ? "No product rows found. Required columns: Brand, SKU, ITEM TITLE, Category, Selling Price."
        : "No product rows found in the uploaded file.",
    );
  }

  return {
    format,
    headers,
    rows,
    totalRowsRead: rawJson.length,
    emptyRowsSkipped,
  };
}

/**
 * Validate uploaded headers match `public/vibemusic bulk.csv` exactly:
 * all 69 columns, canonical spelling, canonical order.
 */
export function validateVibemusicBulkHeaders(headers: string[]): string | null {
  const trimmed = headers.map((header) => header.trim()).filter(Boolean);

  if (trimmed.length !== VIBEMUSIC_BULK_COLUMN_COUNT) {
    return `Vibe Music bulk template requires exactly ${VIBEMUSIC_BULK_COLUMN_COUNT} columns in the official order (found ${trimmed.length}). Download "vibemusic bulk.csv" from the Import dialog and try again.`;
  }

  const mismatches: string[] = [];
  for (let index = 0; index < VIBEMUSIC_BULK_HEADERS.length; index += 1) {
    const expected = VIBEMUSIC_BULK_HEADERS[index]!;
    const actual = trimmed[index]!;
    if (normalizeHeaderKey(actual) !== normalizeHeaderKey(expected)) {
      mismatches.push(`column ${index + 1}: expected "${expected}", got "${actual}"`);
    }
  }

  if (mismatches.length === 0) return null;

  const preview = mismatches.slice(0, 3).join("; ");
  const suffix = mismatches.length > 3 ? ` (+${mismatches.length - 3} more mismatches)` : "";
  return `Header row must match vibemusic bulk.csv exactly. ${preview}${suffix}. Download the template from the Import dialog.`;
}

/** @deprecated Use validateVibemusicBulkHeaders */
export function validateAmazonListingHeaders(headers: string[]): string | null {
  return validateVibemusicBulkHeaders(headers);
}

/** Build a blank CSV matching `public/vibemusic bulk.csv`. */
export function buildAmazonListingTemplateCsv(): string {
  return `${AMAZON_LISTING_HEADERS.join(",")}\n`;
}

export const buildVibemusicBulkTemplateCsv = buildAmazonListingTemplateCsv;

/** Build a blank workbook matching `public/vibemusic bulk.xlsx`. */
export function buildAmazonListingTemplateXlsx(): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([[...AMAZON_LISTING_HEADERS]]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer);
}

export const buildVibemusicBulkTemplateXlsx = buildAmazonListingTemplateXlsx;

/**
 * Resolve product images from a ZIP using SKU naming conventions.
 * Matches: SKU.jpg, SKU_1.jpg, SKU-1.jpg, SKU_2.png, …
 */
export function findSkuImagesInZip(
  zipMap: Map<string, Buffer>,
  sku: string,
): Array<{ filename: string; buffer: Buffer }> {
  const cleaned = sku.trim().toLowerCase();
  if (!cleaned) return [];

  const matches: Array<{ filename: string; buffer: Buffer; order: number }> = [];

  for (const [name, buffer] of zipMap) {
    const base = name.replace(/\.[^.]+$/, "").toLowerCase();
    if (base === cleaned) {
      matches.push({ filename: name, buffer, order: 0 });
      continue;
    }
    const suffix = base.match(new RegExp(`^${escapeRegExp(cleaned)}[_-](\\d+)$`));
    if (suffix) {
      matches.push({ filename: name, buffer, order: Number(suffix[1]) });
    }
  }

  return matches
    .sort((a, b) => a.order - b.order)
    .map(({ filename, buffer }) => ({ filename, buffer }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\");
}

export function isSpreadsheetUpload(filename: string, mimeType = ""): boolean {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".csv") ||
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  );
}

function specValue(
  specifications: Record<string, string> | undefined,
  ...labels: string[]
): string {
  if (!specifications) return "";
  for (const label of labels) {
    const value = specifications[label]?.trim();
    if (value) return value;
  }
  return "";
}

function splitCombinedDimension(combined: string): { value: string; unit: string } {
  const trimmed = combined.trim();
  if (!trimmed) return { value: "", unit: "" };
  const match = trimmed.match(/^([\d.,]+)\s*(.*)$/);
  if (match) {
    return { value: match[1] ?? "", unit: (match[2] ?? "").trim() };
  }
  return { value: trimmed, unit: "" };
}

function splitDescriptionBullets(description: string): {
  intro: string;
  bullets: string[];
} {
  const lines = description
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { intro: "", bullets: [] };
  if (lines.length === 1) return { intro: lines[0]!, bullets: [] };
  return { intro: lines[0]!, bullets: lines.slice(1) };
}

/**
 * Map a catalog product back to an Amazon listing row for export / re-import.
 */
export function catalogProductToAmazonRow(product: {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  sku: string;
  description?: string;
  specifications?: Record<string, string>;
  inTheBox?: string[];
}): Record<AmazonListingHeader, string> {
  const specs = product.specifications ?? {};
  const { intro, bullets } = splitDescriptionBullets(product.description ?? "");
  const fromBox = (product.inTheBox ?? []).filter(Boolean);
  const bulletSource = bullets.length > 0 ? bullets : fromBox;

  const keywords = (specs["Search Keywords"] ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const itemWeight = specValue(specs, "Item Weight");
  const [weightValue, ...weightUnitParts] = itemWeight.split(/\s+/);
  const weightUnit = weightUnitParts.join(" ");

  const row = Object.fromEntries(AMAZON_LISTING_HEADERS.map((header) => [header, ""])) as Record<
    AmazonListingHeader,
    string
  >;

  row.Brand = product.brand ?? "";
  row.SKU = product.sku ?? "";
  row["MODEL NO."] = specValue(specs, "Model No.", "Model Number");
  row["ITEM TITLE"] = product.name ?? "";
  row["Product Description"] = intro;
  row["PRODUCT TYPE"] = specValue(specs, "Product Type");
  row.Category = product.category ?? "";
  row["Product Category"] = specValue(specs, "Product Category");
  row["Product Subcategory"] = product.subcategory ?? "";
  row["Browse Node"] = specValue(specs, "Browse Node");
  row.MRP = product.originalPrice != null ? String(product.originalPrice) : "";
  row["Selling Price"] = String(product.price ?? "");
  row["Model Name"] = specValue(specs, "Model Name");
  row["Model Number"] = specValue(specs, "Model Number");
  row.Manufacturer = specValue(specs, "Manufacturer") || product.brand || "";
  row["Model Year"] = specValue(specs, "Model Year");
  row.Warranty = specValue(specs, "Warranty");
  row.ASIN = specValue(specs, "ASIN");
  row.UPC = specValue(specs, "UPC");
  row["Bullet Point"] = bulletSource[0] ?? "";
  row["Bullet Point.1"] = bulletSource[1] ?? "";
  row["Bullet Point.2"] = bulletSource[2] ?? "";
  row["Bullet Point.3"] = bulletSource[3] ?? "";
  row["Bullet Point.4"] = bulletSource[4] ?? "";
  row["Generic Keyword"] = keywords[0] ?? "";
  row["Generic Keyword.1"] = keywords[1] ?? "";
  row["Generic Keyword.2"] = keywords[2] ?? "";
  row["Special Features"] = fromBox.join("; ");
  row.Style = specValue(specs, "Style");
  row["Age Range Description"] = specValue(specs, "Age Range");
  row["Item Type Name"] = specValue(specs, "Item Type");
  row.Color = specValue(specs, "Color");
  row.Size = specValue(specs, "Size");
  row["Part Number"] = specValue(specs, "Part Number");
  row["Number of Keys"] = specValue(specs, "Number of Keys");
  row["MANUFACTURER CONTACT INFORMATION"] = specValue(specs, "Manufacturer Contact");
  row["Power Source"] = specValue(specs, "Power Source");
  row["Connectivity Technology"] = specValue(specs, "Connectivity");
  row["Connector Type"] = specValue(specs, "Connector Type");
  row["Skill Level"] = specValue(specs, "Skill Level");
  row["Headphones Jack"] = specValue(specs, "Headphones Jack");
  row["Finish Type"] = specValue(specs, "Finish Type");
  row["Unit Count"] = specValue(specs, "Unit Count");
  row["Unit Count Type"] = specValue(specs, "Unit Count Type");
  row.Instrument = specValue(specs, "Instrument");
  row["Importer Contact Information"] = specValue(specs, "Importer Contact");
  row["Packer Contact Information"] = specValue(specs, "Packer Contact");

  const depth = splitCombinedDimension(specValue(specs, "Item Depth"));
  row["Item  Depth Front to Back"] = depth.value;
  row["Item  Depth Unit"] = depth.unit;

  const height = splitCombinedDimension(specValue(specs, "Item Height"));
  row["Height Top to Bottom"] = height.value;
  row["Item Height Unit"] = height.unit;

  const width = splitCombinedDimension(specValue(specs, "Item Width"));
  row["Item  Width Side to Side"] = width.value;
  row["Item Width Unit"] = width.unit;

  row["Maximum Retail Price (MRP)"] =
    product.originalPrice != null ? String(product.originalPrice) : "";

  const packageLength = splitCombinedDimension(specValue(specs, "Package Length"));
  row["Item Package Length"] = packageLength.value;
  row["Package Length Unit"] = packageLength.unit;

  const packageWidth = splitCombinedDimension(specValue(specs, "Package Width"));
  row["Item Package Width"] = packageWidth.value;
  row["Package Width Unit"] = packageWidth.unit;

  const packageHeight = splitCombinedDimension(specValue(specs, "Package Height"));
  row["Item Package Height"] = packageHeight.value;
  row["Package Height Unit"] = packageHeight.unit;

  const packageWeight = splitCombinedDimension(specValue(specs, "Package Weight"));
  row["Package Weight"] = packageWeight.value;
  row["Package Weight Unit"] = packageWeight.unit;

  row["Warranty Description"] = specValue(specs, "Warranty Description");
  row["Are batteries required?"] = specValue(specs, "Batteries Required");
  row["Are batteries included?"] = specValue(specs, "Batteries Included");
  row["Dangerous Goods Regulations"] = specValue(specs, "Dangerous Goods");
  row["Number of Boxes"] = specValue(specs, "Number of Boxes");
  row["Item Weight"] = weightValue ?? "";
  row["Item Weight Unit"] = weightUnit;

  return row;
}

export const catalogProductToBulkRow = catalogProductToAmazonRow;

const FAILED_IMPORT_ERROR_HEADER = "Import Errors";

/** Export failed import rows in the Vibe Music bulk template format for fix-and-reupload. */
export function failedImportRowsToAmazonCsv(
  rows: Array<{
    name: string;
    brand: string;
    category: string;
    subcategory?: string;
    price: number;
    originalPrice?: number;
    sku?: string;
    generatedSku?: string;
    description?: string;
    reason: string;
  }>,
): string {
  const headers = [...AMAZON_LISTING_HEADERS, FAILED_IMPORT_ERROR_HEADER];
  const parsedRows = rows.map((row) => {
    const amazon = catalogProductToAmazonRow({
      name: row.name,
      brand: row.brand,
      category: row.category,
      subcategory: row.subcategory,
      price: row.price,
      originalPrice: row.originalPrice,
      sku: row.sku ?? row.generatedSku ?? "",
      description: row.description,
    });
    return {
      ...amazon,
      [FAILED_IMPORT_ERROR_HEADER]: row.reason,
    };
  });
  return rowsToCsv(headers, parsedRows);
}

export const failedImportRowsToBulkCsv = failedImportRowsToAmazonCsv;
