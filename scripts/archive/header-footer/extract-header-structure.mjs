import fs from "fs";

const h = fs.readFileSync("src/content/header.html", "utf8");

// Top nav links
const navLinks = [...h.matchAll(
  /class="assets-site-header__nav-link[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)</gi
)];
console.log("=== TOP NAV LINKS ===");
navLinks.slice(0, 30).forEach((m) => console.log(m[2].trim(), "->", m[1]));

// data-nav categories
const dataNav = [...h.matchAll(/data-nav="(\d+)"/g)];
const uniqueNav = [...new Set(dataNav.map((m) => m[1]))];
console.log("\n=== data-nav IDs ===", uniqueNav.length, uniqueNav.slice(0, 20));

// top-cat ids
const topCats = [...h.matchAll(/id="(top-cat-\d+)"/g)];
console.log("\n=== top-cat ===", topCats.map((m) => m[1]));

// Extract black bar links
const blackBar = h.match(/id="assets-site-header__black-bar"[\s\S]*?<\/section>/);
if (blackBar) {
  const links = [...blackBar[0].matchAll(/href="([^"]*)"[^>]*>([^<]{1,80})</g)];
  console.log("\n=== BLACK BAR LINKS ===");
  links.slice(0, 15).forEach((m) => console.log(m[2].trim(), "->", m[1]));
}

// Search mount area
const searchIdx = h.indexOf('id="search-mount"');
console.log("\n=== SEARCH MOUNT (500 chars) ===\n", h.slice(searchIdx, searchIdx + 800));

// Menu row structure
const menuRow = h.indexOf("assets-site-header__menu");
console.log("\n=== MENU AREA (1500 chars from first menu) ===\n", h.slice(menuRow, menuRow + 1500));

// Scripts in header
const scripts = [...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
console.log("\n=== INLINE SCRIPTS ===", scripts.length);
scripts.forEach((s, i) => console.log(`Script ${i}:`, s[1].slice(0, 200)));
