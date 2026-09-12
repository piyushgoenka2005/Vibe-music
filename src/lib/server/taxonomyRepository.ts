import "server-only";

import * as XLSX from "xlsx";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import type {
  CatalogTaxonomyItem,
  RawTaxonomyRow,
  TaxonomyImportResult,
  TaxonomyQueryParams,
  TaxonomyStats,
} from "@/types/taxonomy";

/**
 * Normalizes header strings for tolerant matching.
 */
function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Parse an Excel (.xlsx / .xls) or CSV buffer into raw taxonomy rows.
 */
export function parseTaxonomyBuffer(buffer: Buffer): {
  rows: RawTaxonomyRow[];
  totalRowsRead: number;
  duplicatesSkipped: number;
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The uploaded file does not contain any sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rawJson.length === 0) {
    throw new Error("The sheet contains no data rows.");
  }

  // Build header map from the first row's keys
  const sampleKeys = Object.keys(rawJson[0]);
  const headerMap: Record<string, string> = {};
  for (const k of sampleKeys) {
    headerMap[normalizeHeaderKey(k)] = k;
  }

  const getField = (row: Record<string, unknown>, ...candidates: string[]): string => {
    for (const c of candidates) {
      const normalized = normalizeHeaderKey(c);
      const actualKey = headerMap[normalized];
      if (actualKey && row[actualKey] != null) {
        const val = String(row[actualKey]).trim();
        if (val) return val;
      }
    }
    return "";
  };

  const dedupeMap = new Map<string, RawTaxonomyRow>();
  let totalRowsRead = 0;

  for (const row of rawJson) {
    totalRowsRead++;

    const category = getField(row, "category", "category_name");
    const subcategory = getField(row, "subcategory", "sub_category");
    const productType = getField(row, "producttype", "product_type", "type");
    const variant = getField(row, "variant", "variant_name") || null;
    const instrumentFamily = getField(row, "instrumentfamily", "family") || null;
    const seoSlug =
      getField(row, "seoslug", "slug", "seo_slug") ||
      slugify(`${category} ${subcategory} ${productType} ${variant || ""}`);
    const googleProductCategory = getField(row, "googleproductcategory", "google_category") || null;
    const menuLevel1 = getField(row, "menulevel1", "menu_1", "level1") || null;
    const menuLevel2 = getField(row, "menulevel2", "menu_2", "level2") || null;
    const menuLevel3 = getField(row, "menulevel3", "menu_3", "level3") || null;

    if (!category && !subcategory && !productType) {
      continue; // Skip empty trailing rows
    }

    // Deduplication key based on the primary classification attributes
    const dedupeKey = [
      category.toLowerCase(),
      subcategory.toLowerCase(),
      productType.toLowerCase(),
      (variant || "").toLowerCase(),
      seoSlug.toLowerCase(),
    ].join("::");

    if (!dedupeMap.has(dedupeKey)) {
      dedupeMap.set(dedupeKey, {
        category,
        subcategory,
        variant,
        productType,
        instrumentFamily,
        seoSlug,
        googleProductCategory,
        menuLevel1,
        menuLevel2,
        menuLevel3,
      });
    }
  }

  const uniqueRows = Array.from(dedupeMap.values());
  const duplicatesSkipped = totalRowsRead - uniqueRows.length;

  return {
    rows: uniqueRows,
    totalRowsRead,
    duplicatesSkipped,
  };
}

/**
 * Bulk import parsed taxonomy rows into PostgreSQL in chunks.
 */
export async function bulkImportTaxonomies(
  rows: RawTaxonomyRow[],
  totalRowsRead: number,
  duplicatesSkipped: number,
  replaceExisting = false,
): Promise<TaxonomyImportResult> {
  const startTime = Date.now();

  if (!isPostgresConfigured()) {
    return {
      totalRowsRead,
      uniqueRowsImported: rows.length,
      duplicatesSkipped,
      durationMs: Date.now() - startTime,
    };
  }

  const now = new Date().toISOString();

  if (replaceExisting) {
    await prisma.catalogTaxonomy.deleteMany({});
  }

  // Insert in batches of 1000
  const BATCH_SIZE = 1000;
  let importedCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE).map((r) => ({
      category: r.category,
      subcategory: r.subcategory,
      variant: r.variant,
      productType: r.productType,
      instrumentFamily: r.instrumentFamily,
      seoSlug: r.seoSlug,
      googleProductCategory: r.googleProductCategory,
      menuLevel1: r.menuLevel1,
      menuLevel2: r.menuLevel2,
      menuLevel3: r.menuLevel3,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await prisma.catalogTaxonomy.createMany({
      data: chunk,
      skipDuplicates: true,
    });

    importedCount += result.count;
  }

  return {
    totalRowsRead,
    uniqueRowsImported: importedCount,
    duplicatesSkipped,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Paginated query with search, category filtering, and counts.
 */
export async function getTaxonomies(params: TaxonomyQueryParams = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(10, Number(params.limit) || 25));
  const skip = (page - 1) * limit;

  if (!isPostgresConfigured()) {
    return {
      items: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  const where: Record<string, unknown> = {};

  if (params.category && params.category !== "all") {
    where.category = { equals: params.category, mode: "insensitive" };
  }

  if (params.subcategory && params.subcategory !== "all") {
    where.subcategory = { equals: params.subcategory, mode: "insensitive" };
  }

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [
      { category: { contains: term, mode: "insensitive" } },
      { subcategory: { contains: term, mode: "insensitive" } },
      { productType: { contains: term, mode: "insensitive" } },
      { variant: { contains: term, mode: "insensitive" } },
      { seoSlug: { contains: term, mode: "insensitive" } },
      { googleProductCategory: { contains: term, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.catalogTaxonomy.count({ where }),
    prisma.catalogTaxonomy.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ category: "asc" }, { subcategory: "asc" }, { productType: "asc" }],
    }),
  ]);

  return {
    items: items as CatalogTaxonomyItem[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Aggregate high-level statistics for the taxonomy explorer dashboard.
 */
export async function getTaxonomyStats(): Promise<TaxonomyStats> {
  if (!isPostgresConfigured()) {
    return {
      totalNodes: 0,
      distinctCategories: 0,
      distinctSubcategories: 0,
      distinctProductTypes: 0,
      distinctGoogleCategories: 0,
    };
  }

  const [totalNodes, categories, subcategories, productTypes, googleCategories] = await Promise.all(
    [
      prisma.catalogTaxonomy.count(),
      prisma.catalogTaxonomy.findMany({
        select: { category: true },
        distinct: ["category"],
      }),
      prisma.catalogTaxonomy.findMany({
        select: { subcategory: true },
        distinct: ["subcategory"],
      }),
      prisma.catalogTaxonomy.findMany({
        select: { productType: true },
        distinct: ["productType"],
      }),
      prisma.catalogTaxonomy.findMany({
        where: { googleProductCategory: { not: null } },
        select: { googleProductCategory: true },
        distinct: ["googleProductCategory"],
      }),
    ],
  );

  return {
    totalNodes,
    distinctCategories: categories.length,
    distinctSubcategories: subcategories.length,
    distinctProductTypes: productTypes.length,
    distinctGoogleCategories: googleCategories.length,
  };
}

/**
 * Returns distinct category and subcategory filter options.
 */
export async function getTaxonomyFilterOptions() {
  if (!isPostgresConfigured()) {
    return { categories: [], subcategories: [] };
  }

  const [categories, subcategories] = await Promise.all([
    prisma.catalogTaxonomy.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
    prisma.catalogTaxonomy.findMany({
      select: { subcategory: true },
      distinct: ["subcategory"],
      orderBy: { subcategory: "asc" },
    }),
  ]);

  return {
    categories: categories.map((c) => c.category).filter(Boolean),
    subcategories: subcategories.map((s) => s.subcategory).filter(Boolean),
  };
}

/**
 * Sync distinct categories and subcategories from the taxonomy table to the main Category table.
 */
export async function syncCategoriesFromTaxonomy(): Promise<{
  created: number;
  existing: number;
}> {
  if (!isPostgresConfigured()) {
    return { created: 0, existing: 0 };
  }

  const taxonomies = await prisma.catalogTaxonomy.findMany({
    select: { category: true, subcategory: true },
    distinct: ["category", "subcategory"],
  });

  const now = new Date().toISOString();
  let created = 0;
  let existing = 0;

  // Process top-level categories first
  const topCategories = Array.from(new Set(taxonomies.map((t) => t.category).filter(Boolean)));
  const parentIdMap = new Map<string, string>();

  for (const catName of topCategories) {
    const slug = slugify(catName);
    const found = await prisma.category.findUnique({ where: { slug } });
    if (found) {
      parentIdMap.set(catName, found.id);
      existing++;
    } else {
      const newCat = await prisma.category.create({
        data: {
          id: `cat_${slug}`,
          name: catName,
          slug,
          isFeatured: false,
          createdAt: now,
          updatedAt: now,
        },
      });
      parentIdMap.set(catName, newCat.id);
      created++;
    }
  }

  // Process subcategories as children
  for (const item of taxonomies) {
    if (!item.subcategory) continue;
    const parentId = parentIdMap.get(item.category) ?? null;
    const subSlug = slugify(`${item.category}-${item.subcategory}`);

    const found = await prisma.category.findUnique({ where: { slug: subSlug } });
    if (found) {
      existing++;
    } else {
      await prisma.category.create({
        data: {
          id: `cat_${subSlug}`,
          name: item.subcategory,
          slug: subSlug,
          parentId,
          isFeatured: false,
          createdAt: now,
          updatedAt: now,
        },
      });
      created++;
    }
  }

  return { created, existing };
}

/**
 * Export all taxonomy entries to CSV format string.
 */
export async function exportTaxonomyCsv(): Promise<string> {
  if (!isPostgresConfigured()) {
    return "Category,Subcategory,Variant,Product Type,Instrument Family,SEO Slug,Google Product Category,Menu Level 1,Menu Level 2,Menu Level 3\n";
  }

  const rows = await prisma.catalogTaxonomy.findMany({
    orderBy: [{ category: "asc" }, { subcategory: "asc" }, { productType: "asc" }],
  });

  const headers = [
    "Category",
    "Subcategory",
    "Variant",
    "Product Type",
    "Instrument Family",
    "SEO Slug",
    "Google Product Category",
    "Menu Level 1",
    "Menu Level 2",
    "Menu Level 3",
  ];

  const escapeCsv = (val: string | null | undefined): string => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escapeCsv(r.category),
        escapeCsv(r.subcategory),
        escapeCsv(r.variant),
        escapeCsv(r.productType),
        escapeCsv(r.instrumentFamily),
        escapeCsv(r.seoSlug),
        escapeCsv(r.googleProductCategory),
        escapeCsv(r.menuLevel1),
        escapeCsv(r.menuLevel2),
        escapeCsv(r.menuLevel3),
      ].join(","),
    ),
  ];

  return lines.join("\n");
}

/**
 * Get distinct subcategories for a given category from Taxonomy or Category table.
 */
export async function getSubcategoriesByCategory(category: string): Promise<string[]> {
  if (!isPostgresConfigured() || !category) {
    return [];
  }

  // 1. Query CatalogTaxonomy table first
  const taxonomyItems = await prisma.catalogTaxonomy.findMany({
    where: {
      category: { equals: category, mode: "insensitive" },
    },
    select: { subcategory: true },
    distinct: ["subcategory"],
    orderBy: { subcategory: "asc" },
  });

  const fromTaxonomy = taxonomyItems.map((t) => t.subcategory).filter(Boolean);
  if (fromTaxonomy.length > 0) {
    return fromTaxonomy;
  }

  // 2. Query Category table (children where parentId matches category)
  const parentCat = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: category, mode: "insensitive" } },
        { slug: { equals: slugify(category), mode: "insensitive" } },
      ],
    },
  });

  if (parentCat) {
    const children = await prisma.category.findMany({
      where: { parentId: parentCat.id },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return children.map((c) => c.name).filter(Boolean);
  }

  return [];
}
