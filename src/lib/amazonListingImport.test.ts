import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  VIBEMUSIC_BULK_COLUMN_COUNT,
  VIBEMUSIC_BULK_HEADERS,
  VIBEMUSIC_BULK_TEMPLATE_CSV_FILE,
  VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE,
  buildVibemusicBulkTemplateCsv,
  buildVibemusicBulkTemplateXlsx,
  catalogProductToBulkRow,
  detectProductImportFormat,
  failedImportRowsToBulkCsv,
  findSkuImagesInZip,
  parseListingPrice,
  parseProductImportBuffer,
  validateVibemusicBulkHeaders,
  vibemusicBulkRowToImportRow,
} from "@/lib/admin/bulkImportTemplate";

describe("vibemusic bulk import", () => {
  it("exposes the canonical vibemusic bulk header set in exact order", () => {
    expect(VIBEMUSIC_BULK_HEADERS[0]).toBe("Brand");
    expect(VIBEMUSIC_BULK_HEADERS[1]).toBe("SKU");
    expect(VIBEMUSIC_BULK_HEADERS[2]).toBe("MODEL NO.");
    expect(VIBEMUSIC_BULK_HEADERS[3]).toBe("ITEM TITLE");
    expect(VIBEMUSIC_BULK_HEADERS).toContain("Selling Price");
    expect(VIBEMUSIC_BULK_HEADERS).toContain("Bullet Point.4");
    expect(VIBEMUSIC_BULK_HEADERS[47]).toBe("Item  Depth Front to Back");
    expect(VIBEMUSIC_BULK_HEADERS[68]).toBe("Item Weight Unit");
    expect(VIBEMUSIC_BULK_COLUMN_COUNT).toBe(69);
  });

  it("detects vibemusic bulk vs legacy headers", () => {
    expect(detectProductImportFormat([...VIBEMUSIC_BULK_HEADERS])).toBe("vibemusic-bulk");
    expect(detectProductImportFormat(["name", "brand", "category", "price"])).toBe("legacy");
  });

  it("parses currency-formatted prices", () => {
    expect(parseListingPrice("₹12,499.00")).toBe(12499);
    expect(parseListingPrice("1,299")).toBe(1299);
    expect(parseListingPrice(4999)).toBe(4999);
    expect(parseListingPrice("")).toBeUndefined();
  });

  it("maps a full vibemusic bulk row into catalog fields", () => {
    const headerMap = new Map(
      VIBEMUSIC_BULK_HEADERS.map((h) => [h.toLowerCase().replace(/[^a-z0-9]/g, ""), h]),
    );
    const row: Record<string, unknown> = {
      Brand: "Yamaha",
      SKU: "YM-PSR-E373",
      "ITEM TITLE": "Yamaha PSR-E373 61-Key Portable Keyboard",
      "Product Description": "Entry-level keyboard with touch response.",
      Category: "Keyboards",
      "Product Subcategory": "Portable Keyboards",
      MRP: "18,990",
      "Selling Price": "15,990",
      "Bullet Point": "61 full-size keys",
      "Bullet Point.1": "482 voices",
      "Bullet Point.2": "USB to host",
      ASIN: "B08XXXX",
      Color: "Black",
      Warranty: "1 Year",
      "Generic Keyword": "keyboard",
      "Generic Keyword.1": "yamaha",
      "Special Features": "Power adapter; Music rest; Sustain pedal",
      "Item Weight": "4.6",
      "Item Weight Unit": "kg",
    };

    const mapped = vibemusicBulkRowToImportRow(row, headerMap);
    expect(mapped).not.toBeNull();
    expect(mapped!.sourceFormat).toBe("vibemusic-bulk");
    expect(mapped!.name).toContain("Yamaha PSR-E373");
    expect(mapped!.brand).toBe("Yamaha");
    expect(mapped!.category).toBe("Portable Keyboards");
    expect(mapped!.subcategory).toBe("Portable Keyboards");
    expect(mapped!.price).toBe(15990);
    expect(mapped!.originalPrice).toBe(18990);
    expect(mapped!.sku).toBe("YM-PSR-E373");
    expect(mapped!.description).toContain("61 full-size keys");
    expect(mapped!.description).toContain("482 voices");
    expect(mapped!.specifications?.ASIN).toBe("B08XXXX");
    expect(mapped!.specifications?.Color).toBe("Black");
    expect(mapped!.specifications?.["Item Weight"]).toBe("4.6 kg");
    expect(mapped!.specifications?.["Search Keywords"]).toContain("keyboard");
    expect(mapped!.inTheBox).toEqual(["Power adapter", "Music rest", "Sustain pedal"]);
    expect(mapped!.detailSpecs?.some((s) => s.label === "Warranty")).toBe(true);
  });

  it("uses MRP as Selling Price when Selling Price cell is blank", () => {
    const headerMap = new Map(
      VIBEMUSIC_BULK_HEADERS.map((h) => [h.toLowerCase().replace(/[^a-z0-9]/g, ""), h]),
    );
    const row: Record<string, unknown> = {
      Brand: "Zoom",
      SKU: "VM-00050",
      "ITEM TITLE": "Zoom G1X FOUR Guitar Multi-Effects Processor",
      Category: "Musical Instruments",
      MRP: "18,990",
      "Selling Price": "",
    };

    const mapped = vibemusicBulkRowToImportRow(row, headerMap);
    expect(mapped?.price).toBe(18990);
    expect(mapped?.originalPrice).toBe(18990);
    expect(mapped?.priceFromMrpFallback).toBe(true);
  });

  it("prefers specific subcategory over generic Musical Instruments category", () => {
    const headerMap = new Map(
      VIBEMUSIC_BULK_HEADERS.map((h) => [h.toLowerCase().replace(/[^a-z0-9]/g, ""), h]),
    );
    const mapped = vibemusicBulkRowToImportRow(
      {
        Brand: "Zoom",
        SKU: "VM-00050",
        "ITEM TITLE": "Zoom G1X FOUR Guitar Multi-Effects Processor",
        Category: "Musical Instruments",
        "Product Subcategory": "Guitar & Bass Accessories",
        "Selling Price": "12999",
      },
      headerMap,
    );
    expect(mapped?.category).toBe("Guitar & Bass Accessories");
  });

  it("parses the official template workbook and skips empty padding rows", () => {
    const wb = XLSX.utils.book_new();
    const data = [
      [...VIBEMUSIC_BULK_HEADERS],
      [
        "Fender",
        "FN-STRAT-01",
        "Player Strat",
        "Fender Player Stratocaster",
        "Iconic electric guitar.",
        "Guitar",
        "Guitars",
        "Electric Guitars",
        "Solid Body",
        "",
        "81454",
        "70830",
        ...Array(VIBEMUSIC_BULK_HEADERS.length - 12).fill(""),
      ],
      Array(VIBEMUSIC_BULK_HEADERS.length).fill(""),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
    const buffer = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer);

    const parsed = parseProductImportBuffer(buffer, "listing.xlsx");
    expect(parsed.format).toBe("vibemusic-bulk");
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.emptyRowsSkipped).toBe(1);
    expect(parsed.rows[0]!.name).toBe("Fender Player Stratocaster");
    expect(parsed.rows[0]!.price).toBe(70830);
    expect(parsed.rows[0]!.originalPrice).toBe(81454);
  });

  it("requires all 69 headers in exact order", () => {
    expect(validateVibemusicBulkHeaders([...VIBEMUSIC_BULK_HEADERS])).toBeNull();

    expect(validateVibemusicBulkHeaders(["Brand", "SKU", "ITEM TITLE", "Selling Price"])).toMatch(
      /requires exactly 69 columns/,
    );

    const reordered = [...VIBEMUSIC_BULK_HEADERS];
    [reordered[0], reordered[1]] = [reordered[1]!, reordered[0]!];
    expect(validateVibemusicBulkHeaders(reordered)).toMatch(/column 1: expected "Brand"/);
  });

  it("exports failed rows in vibemusic bulk template format", () => {
    const csv = failedImportRowsToBulkCsv([
      {
        name: "Bad Guitar",
        brand: "Brand",
        category: "Guitars",
        price: 1000,
        sku: "BAD-1",
        reason: "Category not found",
      },
    ]);
    expect(csv.startsWith(VIBEMUSIC_BULK_HEADERS.join(","))).toBe(true);
    expect(csv).toContain("Import Errors");
    expect(csv).toContain("Category not found");
  });

  it("builds a downloadable template CSV with exact headers", () => {
    const csv = buildVibemusicBulkTemplateCsv();
    expect(csv.startsWith(VIBEMUSIC_BULK_HEADERS.join(","))).toBe(true);
  });

  it("builds a downloadable template workbook with exact headers", () => {
    const buffer = buildVibemusicBulkTemplateXlsx();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]!]!, {
      header: 1,
      defval: "",
    }) as string[][];
    expect(rows[0]).toEqual([...VIBEMUSIC_BULK_HEADERS]);
  });

  it("round-trips combined dimensions on export", () => {
    const row = catalogProductToBulkRow({
      name: "Test Keyboard",
      brand: "Yamaha",
      category: "Keyboards",
      price: 1000,
      originalPrice: 1200,
      sku: "TEST-1",
      specifications: {
        "Item Depth": "10 cm",
        "Item Height": "5 in",
        "Item Width": "40 cm",
        "Package Length": "50 cm",
        "Package Width": "20 cm",
        "Package Height": "15 cm",
        "Package Weight": "2 kg",
        "Item Weight": "1.5 kg",
      },
    });

    expect(row["Item  Depth Front to Back"]).toBe("10");
    expect(row["Item  Depth Unit"]).toBe("cm");
    expect(row["Height Top to Bottom"]).toBe("5");
    expect(row["Item Height Unit"]).toBe("in");
    expect(row["Item Package Length"]).toBe("50");
    expect(row["Package Weight"]).toBe("2");
    expect(row["Package Weight Unit"]).toBe("kg");
  });

  it("ships public vibemusic bulk templates that match the canonical header order", () => {
    const publicDir = path.join(process.cwd(), "public");
    const csvPath = path.join(publicDir, VIBEMUSIC_BULK_TEMPLATE_CSV_FILE);
    const xlsxPath = path.join(publicDir, VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE);

    if (!fs.existsSync(csvPath) || !fs.existsSync(xlsxPath)) {
      // Templates are generated locally via `npm run generate:vibemusic-bulk-template`
      // and are gitignored client assets — skip when absent in CI checkouts.
      return;
    }

    const csvHeaders = fs.readFileSync(csvPath, "utf8").trim().split(",");
    expect(csvHeaders).toEqual([...VIBEMUSIC_BULK_HEADERS]);

    const workbook = XLSX.readFile(xlsxPath);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]!]!, {
      header: 1,
      defval: "",
    }) as string[][];
    expect(rows[0]).toEqual([...VIBEMUSIC_BULK_HEADERS]);
  });

  it("matches SKU-named images inside a ZIP map", () => {
    const zipMap = new Map<string, Buffer>([
      ["ym-psr-e373.jpg", Buffer.from("a")],
      ["ym-psr-e373_2.png", Buffer.from("b")],
      ["other.jpg", Buffer.from("c")],
    ]);
    const matches = findSkuImagesInZip(zipMap, "YM-PSR-E373");
    expect(matches.map((m) => m.filename)).toEqual(["ym-psr-e373.jpg", "ym-psr-e373_2.png"]);
  });
});
