const fs = require("fs");
const h = fs.readFileSync("sweatwater.html", "utf8");
const bodyStart = h.indexOf("<body");
const bodyEnd = h.lastIndexOf("</body>");
const body = h.substring(bodyStart, bodyEnd);

function between(start, end, file) {
  const s = body.indexOf(start);
  const e = end ? body.indexOf(end, s + start.length) : body.length;
  if (s < 0) {
    console.log("MISSING:", start);
    return;
  }
  const content = body.substring(s, e > s ? e : s + 80000);
  fs.writeFileSync(`scripts/${file}`, content);
  console.log(file, content.length);
}

between('data-header-version="1780573205"', '<div class="homepage-wrapper" id="main-content">', "section-header-clean.html");
between('<div class="homepage-wrapper" id="main-content">', 'id="popular-categories"', "section-main-open.html");
between('id="personalization-widgets"', 'id="popular-categories"', "section-personalization.html");
between('id="popular-categories"', 'id="sales-events"', "section-popular-categories.html");
between('id="sales-events"', 'id="tile-block', "section-sales-events.html");
between('id="tile-block', 'id="hero-tiles"', "section-tile-block.html");
between('id="hero-tiles"', 'id="suggested-products"', "section-hero-tiles.html");
between('id="suggested-products"', 'id="value-adds"', "section-suggested-products.html");
between('id="value-adds"', 'id="topnew-products"', "section-value-ads.html");
between('id="topnew-products"', 'id="sales-engineer"', "section-topnew-products.html");
between('id="sales-engineer"', 'id="score-gear-offers"', "section-sales-engineer.html");
between('id="score-gear-offers"', 'id="suggested-gx-products"', "section-score-gear.html");
between('id="suggested-gx-products"', 'id="hottest-deals"', "section-suggested-gx.html");
between('id="hottest-deals"', 'id="research-articles"', "section-hottest-deals.html");
between('id="research-articles"', 'id="homepage-careers"', "section-research-articles.html");
between('id="homepage-careers"', 'id="assets-footer"', "section-careers.html");
between('id="assets-footer"', '</body>', "section-footer.html");
