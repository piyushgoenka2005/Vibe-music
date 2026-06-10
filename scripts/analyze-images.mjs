import fs from "fs";
import path from "path";

const files = [
  "src/content/main.html",
  "src/content/header.html",
  "src/content/footer.html",
];

const urls = new Set();
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/https:\/\/media\.vibemusic\.in[^"'\s)]+/g)) {
    urls.add(match[0]);
  }
}

console.log("unique urls:", urls.size);
for (const url of [...urls].slice(0, 8)) {
  console.log(url);
}

const header = fs.readFileSync("src/content/header.html", "utf8");
const logoMatches = header.match(/[^"']*logo[^"']*/gi) ?? [];
console.log("\nlogo-related strings:");
for (const m of logoMatches.slice(0, 20)) {
  console.log(m.slice(0, 120));
}
