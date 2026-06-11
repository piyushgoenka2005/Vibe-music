import fs from "fs";

const h = fs.readFileSync("src/content/header.html", "utf8");

const markers = [
  "assets-site-header__ada",
  'id="assets-header"',
  "assets-site-header__sp-language",
  "assets-site-header__black-bar",
  'class="assets-site-header__menu"',
  'class="assets-site-header__nav"',
  "mega-nav",
  "assets-site-header__mobile",
  "assets-site-header__nav-menu-contact",
];

for (const m of markers) {
  const i = h.indexOf(m);
  console.log(m, "@", i);
}

// Find nav start
const navStart = h.indexOf('<nav class="assets-site-header__nav');
console.log("\nnav start", navStart);

// mobile
const mobile = h.indexOf("assets-site-header__mobile");
console.log("mobile", mobile);

// menu icons area
const account = h.indexOf("assets-site-header__menu-account");
const cart = h.indexOf("assets-site-header__menu-cart");
console.log("account", account, "cart", cart);

// Extract category nav item labels
const cats = [
  ...h.matchAll(
    /class="assets-site-header__nav-menu-category[^"]*"[^>]*>[\s\S]*?assets-site-header__nav-menu-item-link[^>]*>([^<]+)</gi
  ),
];
console.log("\nCategories:", cats.map((m) => m[1].trim()).slice(0, 20));

console.log("\n--- END ---");
console.log(h.slice(-400));
console.log("nav idx", h.indexOf('<nav class="assets-site-header__nav"'));
