import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const WIDTHS = [320, 480, 800, 960, 1600];
const CDN_STORAGE_ROOT = path.join(process.cwd(), ".data", "cdn");
const CDN_PUBLIC_BASE_URL = "https://cdn.vibemusic.in";

// The 14 affected products identified from the production catalog
const AFFECTED_PRODUCT_IDS = [
  "prod-mtk29crv",
  "prod-mtk29cqi",
  "prod-mtk29cod",
  "prod-mtk29clf",
  "prod-mtk29ck5",
  "prod-mtk29cik",
  "prod-mtk29cgt",
  "prod-mtk29cew",
  "prod-mtk1gf11",
  "prod-mtk09eii",
  "prod-mtk09egl",
  "prod-mtk09eel",
  "prod-mtk09ecs",
  "prod-mtk09eam"
];

async function downloadWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });
      clearTimeout(timer);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) {
        throw new Error("Empty response body");
      }
      return buffer;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`    Attempt ${attempt}/${maxRetries} failed for ${url}: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  console.log("=== VIBEMUSIC postimg.cc IMAGE MIGRATION PIPELINE ===\n");
  console.log(`Targeting ${AFFECTED_PRODUCT_IDS.length} affected products...`);

  // Fetch full details for all 14 products from production API
  const products = [];
  for (const id of AFFECTED_PRODUCT_IDS) {
    console.log(`Fetching product detail for ${id}...`);
    const listRes = await fetch("https://vibemusic.in/api/products?limit=200");
    const listData = await listRes.json();
    const all = listData.products || listData;
    const prod = all.find(p => p.id === id);
    if (!prod) {
      console.error(`Product ${id} not found in listing!`);
      continue;
    }

    const detailRes = await fetch(`https://vibemusic.in/api/products/${prod.slug}`);
    if (!detailRes.ok) {
      console.error(`Product ${prod.slug} detail failed: ${detailRes.status}`);
      continue;
    }
    const detailData = await detailRes.json();
    products.push(detailData.product || detailData);
  }

  console.log(`\nFetched ${products.length} products successfully.`);

  // Map of postimg URL -> { uuid, cdnMasterUrl, cdnCardUrl, categorySlug, productSlug, relativeDir }
  const urlMap = new Map();
  const successfulMigrations = [];
  const failedMigrations = [];

  for (const p of products) {
    const categorySlug = p.categorySlug || "guitars";
    const productSlug = p.slug;
    const destRelDir = path.join("products", categorySlug, productSlug);
    const destAbsDir = path.join(CDN_STORAGE_ROOT, destRelDir);

    fs.mkdirSync(destAbsDir, { recursive: true });

    // Collect all postimg URLs for this product
    const urlsToMigrate = [];
    if (typeof p.image === "string" && p.image.includes("postimg.cc")) {
      urlsToMigrate.push(p.image);
    }
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        const src = typeof img === "string" ? img : img?.src;
        if (typeof src === "string" && src.includes("postimg.cc") && !urlsToMigrate.includes(src)) {
          urlsToMigrate.push(src);
        }
      }
    }

    console.log(`\nMigrating Product [${p.id}] "${p.name}": ${urlsToMigrate.length} postimg images`);
    console.log(`  Destination directory: .data/cdn/${destRelDir.replace(/\\/g, "/")}`);

    for (let i = 0; i < urlsToMigrate.length; i++) {
      const sourceUrl = urlsToMigrate[i];
      if (urlMap.has(sourceUrl)) {
        console.log(`  Already processed ${sourceUrl}`);
        continue;
      }

      console.log(`  Downloading [${i+1}/${urlsToMigrate.length}]: ${sourceUrl}...`);
      try {
        const originalBuffer = await downloadWithRetry(sourceUrl);
        const uuid = crypto.randomUUID();

        // 1. Convert to Master WebP (quality 92, max edge 2000)
        const masterBuffer = await sharp(originalBuffer)
          .rotate()
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 92, effort: 5 })
          .toBuffer();

        const masterFilename = `${uuid}.webp`;
        const masterPath = path.join(destAbsDir, masterFilename);
        fs.writeFileSync(masterPath, masterBuffer);

        // 2. Generate all 5 standard derivatives
        for (const w of WIDTHS) {
          const derivBuffer = await sharp(masterBuffer)
            .resize(w, w, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85, effort: 4 })
            .toBuffer();
          const derivFilename = `${uuid}-w${w}.webp`;
          fs.writeFileSync(path.join(destAbsDir, derivFilename), derivBuffer);
        }

        const publicMasterUrl = `${CDN_PUBLIC_BASE_URL}/${destRelDir.replace(/\\/g, "/")}/${masterFilename}`;
        const publicCardUrl = `${CDN_PUBLIC_BASE_URL}/${destRelDir.replace(/\\/g, "/")}/${uuid}-w960.webp`;

        const mapping = {
          sourceUrl,
          uuid,
          categorySlug,
          productSlug,
          masterFilename,
          destRelDir: destRelDir.replace(/\\/g, "/"),
          publicMasterUrl,
          publicCardUrl,
          derivatives: WIDTHS.map(w => `${uuid}-w${w}.webp`)
        };

        urlMap.set(sourceUrl, mapping);
        successfulMigrations.push(mapping);
        console.log(`    -> SAVED: ${masterFilename} + ${WIDTHS.length} derivatives (320w, 480w, 800w, 960w, 1600w)`);
      } catch (err) {
        console.error(`    -> FAILED migrating ${sourceUrl}: ${err.message}`);
        failedMigrations.push({ sourceUrl, productId: p.id, error: err.message });
      }
    }
  }

  console.log(`\n=== DOWNLOAD & OPTIMIZATION RESULTS ===`);
  console.log(`Total images migrated: ${successfulMigrations.length}`);
  console.log(`Total images failed: ${failedMigrations.length}`);

  // Generate database updates
  console.log("\nGenerating database updates for affected products...");
  const sqlStatements = [];
  const productUpdates = [];

  for (const p of products) {
    let hasChanges = false;
    let newMainImage = p.image;

    if (typeof p.image === "string" && urlMap.has(p.image)) {
      newMainImage = urlMap.get(p.image).publicCardUrl;
      hasChanges = true;
    }

    // Process images array
    let newImages = [];
    if (Array.isArray(p.images)) {
      newImages = p.images.map(img => {
        if (typeof img === "string") {
          if (urlMap.has(img)) {
            hasChanges = true;
            return urlMap.get(img).publicCardUrl;
          }
          return img;
        } else if (img && typeof img.src === "string") {
          if (urlMap.has(img.src)) {
            hasChanges = true;
            return {
              ...img,
              src: urlMap.get(img.src).publicCardUrl
            };
          }
          return img;
        }
        return img;
      });
    }

    // Process detail JSON
    let newDetail = p.detail ? JSON.parse(JSON.stringify(p.detail)) : {};
    if (Array.isArray(newDetail.gallery)) {
      newDetail.gallery = newDetail.gallery.map(item => {
        if (item && typeof item.src === "string" && urlMap.has(item.src)) {
          hasChanges = true;
          return {
            ...item,
            src: urlMap.get(item.src).publicCardUrl
          };
        }
        return item;
      });
    }

    if (hasChanges) {
      productUpdates.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        oldImage: p.image,
        newImage: newMainImage,
        newImages,
        newDetail
      });

      // Escape single quotes for SQL
      const escapeSql = (str) => String(str).replace(/'/g, "''");
      const imagesJson = escapeSql(JSON.stringify(newImages));
      const detailJson = escapeSql(JSON.stringify(newDetail));
      const updatedAt = new Date().toISOString();

      sqlStatements.push(`UPDATE "products" SET "image" = '${escapeSql(newMainImage)}', "images" = '${imagesJson}'::jsonb, "detail" = '${detailJson}'::jsonb, "updated_at" = '${updatedAt}' WHERE "id" = '${escapeSql(p.id)}';`);
    }
  }

  // Save SQL migration script
  const migrationSql = `-- Migrate production product images from i.postimg.cc to cdn.vibemusic.in
-- Generated at: ${new Date().toISOString()}
-- Affected products count: ${productUpdates.length}

BEGIN;

${sqlStatements.join("\n\n")}

COMMIT;
`;

  const migrationDir = path.join(process.cwd(), "prisma", "migrations", "20260908163000_migrate_postimg_to_cdn");
  fs.mkdirSync(migrationDir, { recursive: true });
  fs.writeFileSync(path.join(migrationDir, "migration.sql"), migrationSql);
  console.log(`Saved Prisma migration SQL to: ${path.relative(process.cwd(), path.join(migrationDir, "migration.sql"))}`);

  // Also save json mapping and updates for inspection
  fs.writeFileSync(
    "scripts/postimg_migration_manifest.json",
    JSON.stringify({ successfulMigrations, productUpdates, failedMigrations }, null, 2)
  );
  console.log("Saved scripts/postimg_migration_manifest.json");

  console.log(`\n=== FINAL MIGRATION SUMMARY ===`);
  console.log(`Products Found: ${AFFECTED_PRODUCT_IDS.length}`);
  console.log(`Images Found: ${urlMap.size}`);
  console.log(`Images Migrated: ${successfulMigrations.length}`);
  console.log(`Images Failed: ${failedMigrations.length}`);
  console.log(`Products with DB updates prepared: ${productUpdates.length}`);
}

main().catch(console.error);
