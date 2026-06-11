import fs from "fs";

const h = fs.readFileSync("src/content/header.html", "utf8");
const menu = h.slice(4432, 29974);

const markers = [
  "menu-logo-wrap",
  "search-mount",
  "classic-search-container",
  "menu-contact",
  "menu-account",
  "menu-cart-wrap",
  "menu-nav-toggle",
];

for (const m of markers) {
  console.log(m, menu.indexOf(m));
}
