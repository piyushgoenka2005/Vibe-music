import fs from "fs";
import path from "path";

const sw = fs.readFileSync(path.join(process.cwd(), "homepage-source.html"), "utf8");
const main = fs.readFileSync(
  path.join(process.cwd(), "src", "content", "main.html"),
  "utf8"
);

const ids = [
  "personalization-widgets",
  "popular-categories",
  "sales-events",
  "hero-tiles",
  "suggested-products",
  "value-adds",
  "top-new-products",
  "sales-engineer",
  "suggested-gx-products",
  "hottest-deals",
  "research-articles",
  "careers",
];

for (const id of ids) {
  const marker = `id="${id}"`;
  const swHas = sw.includes(marker);
  const mainHas = main.includes(marker);
  console.log(id, swHas && mainHas ? "OK" : "MISSING", { swHas, mainHas });
}

console.log("\nBranding:");
console.log("Vibe Music in main:", (main.match(/Vibe Music/g) || []).length);
console.log("vibemusic in main:", (main.match(/vibemusic/gi) || []).length);
