const fs = require("fs");
const h = fs.readFileSync("src/content/header.html", "utf8");
const terms = [
  "sw-search",
  "autocomplete",
  "assets-site-header__search",
  "mobile-search",
  "federated",
];
for (const t of terms) {
  let i = 0;
  let count = 0;
  while ((i = h.indexOf(t, i)) !== -1 && count < 3) {
    console.log("\n---", t, "---");
    console.log(h.substring(Math.max(0, i - 120), i + 400));
    i += t.length;
    count++;
  }
}
