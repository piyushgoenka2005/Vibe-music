import fs from "fs";

const h = fs.readFileSync("src/content/footer.html", "utf8");
console.log("length", h.length);

const patterns = [
  "assets-site-footer",
  "assets-footer",
  "footer-column",
  "footer-link",
  "newsletter",
  "social",
  "copyright",
];

for (const p of patterns) {
  console.log(p, (h.match(new RegExp(p, "gi")) || []).length);
}

const ids = [...h.matchAll(/id="([^"]+)"/gi)].map((m) => m[1]);
console.log("\nIDs:", [...new Set(ids)].join(", "));

console.log("\n--- START (2500) ---\n", h.slice(0, 2500));
console.log("\n--- END (1200) ---\n", h.slice(-1200));
