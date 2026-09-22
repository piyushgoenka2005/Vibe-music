/**
 * Regenerate public Vibe Music bulk-import templates from canonical headers.
 * Usage: npm run generate:vibemusic-bulk-template
 */
import fs from "node:fs";
import path from "node:path";
import {
  VIBEMUSIC_BULK_TEMPLATE_CSV_FILE,
  VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE,
  buildVibemusicBulkTemplateCsv,
  buildVibemusicBulkTemplateXlsx,
} from "../../src/lib/admin/bulkImportTemplate";

const publicDir = path.join(process.cwd(), "public");

fs.writeFileSync(
  path.join(publicDir, VIBEMUSIC_BULK_TEMPLATE_CSV_FILE),
  buildVibemusicBulkTemplateCsv(),
  "utf8",
);
fs.writeFileSync(
  path.join(publicDir, VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE),
  buildVibemusicBulkTemplateXlsx(),
);

console.log(`Wrote public/${VIBEMUSIC_BULK_TEMPLATE_CSV_FILE}`);
console.log(`Wrote public/${VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE}`);
