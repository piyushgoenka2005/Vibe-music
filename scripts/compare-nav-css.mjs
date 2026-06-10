import fs from "fs";

const inline = fs.readFileSync("public/vibe-inline.css", "utf8");

function extractRules(keyword) {
  const parts = inline.split("}");
  return parts
    .filter((p) => p.includes(keyword))
    .map((p) => p.trim() + "}")
    .filter((r) =>
      /nav-sub-menu|nav-menu-dz|nav-menu-used|nav-menu-category|menu-search|mega-nav/.test(
        r
      )
    );
}

for (const kw of [
  "nav-sub-menu{",
  "nav-menu-item--active",
  "nav-menu-dz",
  "nav-menu-used",
  "nav-menu-category",
  "menu-search",
  "mega-nav .mn-nav-child",
]) {
  const rules = extractRules(kw).slice(0, 8);
  if (rules.length) {
    console.log(`\n### ${kw} ###`);
    rules.forEach((r) => console.log(r.slice(0, 500)));
  }
}
