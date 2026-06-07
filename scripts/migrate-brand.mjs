import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);
const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".css",
  ".html",
  ".md",
  ".json",
  ".mts",
]);

const TEXT_REPLACEMENTS = [
  ["Vibe Music", "Vibe Music"],
  ["Vibe Music Studios", "Vibe Music Studios"],
  ["Vibe Music Learning", "Vibe Music Learning"],
  ["Vibe Music News", "Vibe Music News"],
  ["Vibe Music Gear Exchange", "Vibe Music Gear Exchange"],
  ["Vibe Music Card", "Vibe Music Card"],
  ["Vibe Music Financing", "Vibe Music Financing"],
  ["Vibe Music Deals", "Vibe Music Deals"],
  ["Vibe Music Support", "Vibe Music Support"],
  ["Why Choose Vibe Music?", "Why Choose Vibe Music?"],
  ["Why Choose Vibe Music", "Why Choose Vibe Music"],
  ["About Vibe Music", "About Vibe Music"],
  ["Vibe Music Gear Advisors", "Vibe Music Gear Advisors"],
  ["Vibe Music Gear Advisor", "Vibe Music Gear Advisor"],
  ["Vibe Music app phone icon", "Vibe Music app phone icon"],
  ["Vibe Music app", "Vibe Music app"],
  ["Vibe Music App", "Vibe Music App"],
  ["Search Vibe Music", "Search Vibe Music"],
  ["Join Vibe Music", "Join Vibe Music"],
  ["Vibe Music Home Page", "Vibe Music Home Page"],
  [
    "Find Your Next Musical Instrument at Vibe Music",
    "Find Your Next Musical Instrument at Vibe Music",
  ],
  ["from Vibe Music", "from Vibe Music"],
  ["by Vibe Music", "by Vibe Music"],
  ["Vibe Music's", "Vibe Music's"],
  ["Vibe Music", "Vibe Music"],
  ["vibemusic.in", "vibemusic.in"],
  ["VIBE MUSIC", "VIBE MUSIC"],
  ["+91-9876543210", "+91-9876543210"],
  ["+91-9876543210", "+91-9876543210"],
  ["+91-9876543210", "+91-9876543210"],
  ["tel:+919876543210", "tel:+919876543210"],
  ["tel:+91-9876543210", "tel:+919876543210"],
  ["support@vibemusic.in", "support@vibemusic.in"],
  ["support@vibemusic.in", "support@vibemusic.in"],
  ["Vibe Music, Arial", "Vibe Music, Arial"],
  ["font-[Vibe Music,Arial", "font-[Vibe Music,Arial"],
  ["Mumbai, Maharashtra, India", "Mumbai, Maharashtra, India"],
  ["Mumbai, Maharashtra, India", "Mumbai, Maharashtra, India"],
  ["Mumbai, Maharashtra", "Mumbai, Maharashtra"],
  ["media.vibemusic.in", "cdn.vibemusic.in"],
  ["assets.vibemusic.in", "assets.vibemusic.in"],
  ["academy.vibemusic.in", "academy.vibemusic.in"],
  ["studios.vibemusic.in", "studios.vibemusic.in"],
  ["studios.vibemusic.in", "studios.vibemusic.in"],
  ["vibemusic-financing-card", "vibemusic-financing-card"],
  ["vibemusic-logo", "vibemusic-logo"],
  ["vibemusic-tagline", "vibemusic-tagline"],
  ["data-vibe-section", "data-vibe-section"],
  ["data-vibe-header", "data-vibe-header"],
  ["data-vibe-vue", "data-vibe-vue"],
  ["vibe-html-section", "vibe-html-section"],
  ["vibe-inline.css", "vibe-inline.css"],
  ["vibe-app.css", "vibe-app.css"],
  ["vibe-footer.css", "vibe-footer.css"],
  ["@/components/vibe/", "@/components/vibe/"],
  ["components/vibe/", "components/vibe/"],
  ["extract-homepage-html", "extract-homepage-html"],
  ["homepage-source.html", "homepage-source.html"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function migrateFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS.has(ext)) return false;
  if (filePath.endsWith("package-lock.json")) return false;

  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  for (const [from, to] of TEXT_REPLACEMENTS) {
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}

const changed = [];
for (const file of walk(ROOT)) {
  if (migrateFile(file)) changed.push(path.relative(ROOT, file));
}

console.log(`Updated ${changed.length} files`);
changed.slice(0, 40).forEach((file) => console.log(" -", file));
if (changed.length > 40) console.log(` ... and ${changed.length - 40} more`);
