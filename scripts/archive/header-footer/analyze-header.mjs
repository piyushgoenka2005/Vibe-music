import fs from "fs";

const h = fs.readFileSync("src/content/header.html", "utf8");
console.log("length", h.length);

const patterns = [
  "assets-header",
  "assets-site-header__nav-link",
  "assets-site-header__mega",
  "assets-site-header__flyout",
  "data-nav",
  "mega-menu",
  "assets-site-header__menu-search",
  "assets-site-header__menu-cart",
  "assets-site-header__menu-account",
  "assets-site-header__nav-menu",
];

for (const p of patterns) {
  console.log(p, (h.match(new RegExp(p, "gi")) || []).length);
}

const topLevel = [...h.matchAll(/<(section|header|nav|div)[^>]*id="([^"]+)"/gi)].slice(
  0,
  30
);
console.log("\nIDs:", topLevel.map((m) => m[2]).join(", "));

console.log("\n--- first 3000 chars ---\n", h.slice(0, 3000));
