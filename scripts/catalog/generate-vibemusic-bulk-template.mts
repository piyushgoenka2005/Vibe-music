/**
 * Write reference copies for local inspection (optional — not used at runtime).
 * Production downloads: GET /api/admin/products/import/template?format=csv|xlsx
 *
 * Usage: npm run generate:vibemusic-bulk-template
 */
import fs from "node:fs";
import path from "node:path";
import {
  buildVibemusicBulkTemplateCsv,
  buildVibemusicBulkTemplateXlsx,
} from "../../src/lib/admin/bulkImportTemplate";

const outDir = path.join(process.cwd(), "docs", "templates");
fs.mkdirSync(outDir, { recursive: true });

const csvPath = path.join(outDir, "vibemusic-bulk.csv");
const xlsxPath = path.join(outDir, "vibemusic-bulk.xlsx");

fs.writeFileSync(csvPath, buildVibemusicBulkTemplateCsv(), "utf8");
fs.writeFileSync(xlsxPath, buildVibemusicBulkTemplateXlsx());

console.log(`Wrote ${path.relative(process.cwd(), csvPath)}`);
console.log(`Wrote ${path.relative(process.cwd(), xlsxPath)}`);
