const fs = require("fs");
const h = fs.readFileSync("src/content/header.html", "utf8");

const checks = [
  "mega-sbc",
  "menu-nav-toggle",
  "assets-site-header__nav",
  "assets-site-header__menu-account",
  "assets-site-header__menu-cart",
  "search-mount",
  "sw-search-input",
  "notifications",
  "assets-site-header__nav-category",
  "assets-site-header__nav-menu-category",
];

for (const c of checks) {
  console.log(c, h.includes(c) ? "YES" : "NO");
}

const navIdx = h.indexOf('class="assets-site-header__nav"');
console.log("\nNav snippet:", h.substring(navIdx, navIdx + 500));
