const fs = require("fs");
const h = fs.readFileSync("sweatwater.html", "utf8");

const bodyStart = h.indexOf("<body");
const bodyEnd = h.lastIndexOf("</body>");
const body = h.substring(bodyStart, bodyEnd);

function extractBetween(startMarker, endMarker, filename) {
  const start = body.indexOf(startMarker);
  const end = endMarker ? body.indexOf(endMarker, start + startMarker.length) : body.length;
  if (start < 0) {
    console.log(`NOT FOUND: ${startMarker}`);
    return;
  }
  const content = body.substring(start, end > start ? end : start + 50000);
  fs.writeFileSync(filename, content);
  console.log(`Wrote ${filename} (${content.length} chars)`);
}

extractBetween('id="assets-header"', 'id="main-content"', "scripts/section-header.html");
extractBetween('class="personalization-widgets"', 'class="popular-categories"', "scripts/section-personalization.html");
extractBetween('class="popular-categories"', 'class="sale-events', "scripts/section-popular-categories.html");
extractBetween('class="sale-events', 'class="tile-block', "scripts/section-sale-events.html");
extractBetween('class="tile-block', 'class="hero-tiles"', "scripts/section-tile-block.html");
extractBetween('class="hero-tiles"', 'class="suggested-products', "scripts/section-hero-tiles.html");
extractBetween('class="suggested-products', 'class="value-ads"', "scripts/section-suggested-products.html");
extractBetween('class="value-ads"', 'class="topnew-products"', "scripts/section-value-ads.html");
extractBetween('class="topnew-products"', 'class="sales-engineer', "scripts/section-topnew-products.html");
extractBetween('class="sales-engineer', 'class="score-gear"', "scripts/section-sales-engineer.html");
extractBetween('class="score-gear"', 'class="suggested-gx-products', "scripts/section-score-gear.html");
extractBetween('class="suggested-gx-products', 'class="homepage-careers"', "scripts/section-suggested-gx.html");
extractBetween('class="homepage-careers"', 'id="assets-footer"', "scripts/section-careers.html");
extractBetween('id="assets-footer"', '</body>', "scripts/section-footer.html");
