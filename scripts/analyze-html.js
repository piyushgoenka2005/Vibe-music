const fs = require("fs");
const h = fs.readFileSync("homepage-source.html", "utf8");

// Extract all style blocks
const styleBlocks = [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
console.log("Style blocks:", styleBlocks.length);

// Write combined homepage CSS (filter relevant)
let allCss = "";
for (const m of styleBlocks) {
  allCss += m[1] + "\n";
}
fs.writeFileSync("scripts/all-inline-css.css", allCss.substring(0, 500000));

// Extract body content between <body and </body>
const bodyStart = h.indexOf("<body");
const bodyEnd = h.lastIndexOf("</body>");
const body = h.substring(bodyStart, bodyEnd);

// Find main sections
const sectionMarkers = [
  'id="assets-header"',
  'id="main-content"',
  'class="personalization-widgets"',
  'class="popular-categories"',
  'class="sale-events',
  'class="tile-block',
  'class="hero-tiles"',
  'class="suggested-products',
  'class="value-ads"',
  'class="topnew-products"',
  'class="sales-engineer',
  'class="score-gear"',
  'class="suggested-gx-products',
  'class="hottest-deals"',
  'class="research-articles"',
  'class="homepage-careers"',
  'id="assets-footer"',
];

for (const marker of sectionMarkers) {
  const i = body.indexOf(marker);
  console.log(`${marker}: ${i}`);
}

// Extract header to main-content
const headerStart = body.indexOf('id="assets-header"');
const mainStart = body.indexOf('id="main-content"');
fs.writeFileSync("scripts/body-header.html", body.substring(headerStart - 50, mainStart));

// Extract main content sections
const footerStart = body.indexOf('id="assets-footer"');
fs.writeFileSync("scripts/body-main.html", body.substring(mainStart, footerStart));

// Extract footer
fs.writeFileSync("scripts/body-footer.html", body.substring(footerStart, footerStart + 30000));

// Extract link stylesheets
const links = [...h.matchAll(/<link[^>]+rel="stylesheet"[^>]+>/gi)];
console.log("\nStylesheets:");
links.forEach((l) => console.log(l[0].substring(0, 200)));
