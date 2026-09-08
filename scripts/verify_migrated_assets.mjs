import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function main() {
  console.log("=== VERIFYING MIGRATED CDN ASSETS ===\n");
  const manifest = JSON.parse(fs.readFileSync("scripts/postimg_migration_manifest.json", "utf8"));
  const { successfulMigrations, productUpdates } = manifest;

  console.log(`Verifying ${successfulMigrations.length} migrated images (expecting ${successfulMigrations.length * 6} files)...`);

  let totalFilesChecked = 0;
  let corruptedFiles = 0;

  for (const m of successfulMigrations) {
    const dir = path.join(process.cwd(), ".data", "cdn", m.destRelDir);

    // 1. Master WebP
    const masterPath = path.join(dir, m.masterFilename);
    if (!fs.existsSync(masterPath) || fs.statSync(masterPath).size === 0) {
      console.error(`MISSING/EMPTY MASTER: ${masterPath}`);
      corruptedFiles++;
    } else {
      totalFilesChecked++;
      const buf = fs.readFileSync(masterPath);
      const meta = await sharp(buf).metadata();
      if (meta.format !== "webp" || !meta.width || !meta.height) {
        console.error(`CORRUPT MASTER: ${masterPath}`);
        corruptedFiles++;
      }
    }

    // 2. All 5 derivatives
    for (const derivFile of m.derivatives) {
      const derivPath = path.join(dir, derivFile);
      if (!fs.existsSync(derivPath) || fs.statSync(derivPath).size === 0) {
        console.error(`MISSING/EMPTY DERIVATIVE: ${derivPath}`);
        corruptedFiles++;
      } else {
        totalFilesChecked++;
        const buf = fs.readFileSync(derivPath);
        const meta = await sharp(buf).metadata();
        if (meta.format !== "webp") {
          console.error(`CORRUPT DERIVATIVE: ${derivPath}`);
          corruptedFiles++;
        }
      }
    }
  }

  console.log(`\nAsset Verification:`);
  console.log(`  Total WebP files checked on disk: ${totalFilesChecked}`);
  console.log(`  Corrupted/Missing files: ${corruptedFiles}`);

  // Check SQL migration file
  const migrationPath = "prisma/migrations/20260908163000_migrate_postimg_to_cdn/migration.sql";
  const sql = fs.readFileSync(migrationPath, "utf8");
  console.log(`\nPrisma Migration SQL:`);
  console.log(`  File: ${migrationPath}`);
  console.log(`  Size: ${sql.length} characters`);
  console.log(`  Contains BEGIN/COMMIT: ${sql.includes("BEGIN;") && sql.includes("COMMIT;")}`);
  console.log(`  Product update count: ${(sql.match(/UPDATE "products"/g) || []).length}`);

  // Check that NO postimg.cc remains in the new queries (ignoring comments)
  const queryLines = sql.split("\n").filter(l => !l.startsWith("--"));
  const postimgRemaining = queryLines.some(l => l.includes("postimg.cc"));
  console.log(`  Any postimg.cc remaining in SQL queries: ${postimgRemaining}`);

  console.log(`\nALL VERIFICATION CHECKS PASSED: ${corruptedFiles === 0 && !postimgRemaining}`);
}

main().catch(console.error);
