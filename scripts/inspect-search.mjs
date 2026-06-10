import fs from "fs";

const h = fs.readFileSync("src/content/header.html", "utf8");
const idx = h.indexOf("menu-search-typeahead-field");
console.log(h.slice(idx - 300, idx + 800));

const ids = [...h.matchAll(/\bid="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((id) => /search|autocomplete|sw-search/i.test(id));
console.log("\nsearch ids:", ids);
