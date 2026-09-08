import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const WIDTHS = [320, 480, 800, 960, 1600];
const CDN_DIR = path.join(process.cwd(), ".data", "cdn");

function walk(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function generateDerivatives() {
  console.log("=== OFFLINE CDN DERIVATIVE GENERATOR ===");
  if (!fs.existsSync(CDN_DIR)) {
    console.error("Directory .data/cdn does not exist.");
    process.exit(1);
  }

  const allFiles = walk(CDN_DIR);
  // Master image match: UUID or non-derivative image filename ending in .png, .jpg, .jpeg, .webp
  const masterFiles = allFiles.filter((f) => {
    const name = path.basename(f);
    if (name.includes("-w") && /-w\d+\.webp$/i.test(name)) return false;
    return /\.(png|jpg|jpeg|webp)$/i.test(name);
  });

  console.log(`Found ${masterFiles.length} master images in ${CDN_DIR}`);

  let generatedCount = 0;
  let skippedCount = 0;

  for (const masterPath of masterFiles) {
    const dir = path.dirname(masterPath);
    const ext = path.extname(masterPath);
    const baseName = path.basename(masterPath, ext);

    for (const w of WIDTHS) {
      const derivName = `${baseName}-w${w}.webp`;
      const derivPath = path.join(dir, derivName);

      if (fs.existsSync(derivPath) && fs.statSync(derivPath).size > 0) {
        skippedCount++;
        continue;
      }

      try {
        await sharp(masterPath)
          .rotate()
          .resize(w, w, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85, effort: 4 })
          .toFile(derivPath);

        generatedCount++;
      } catch (err) {
        console.error(`Failed generating ${derivPath}:`, err.message);
      }
    }
  }

  console.log(`\nDONE: Generated ${generatedCount} derivative WebP images. Skipped ${skippedCount} existing.`);
}

generateDerivatives().catch(console.error);
