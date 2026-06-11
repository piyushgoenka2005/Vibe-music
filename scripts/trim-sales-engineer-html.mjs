import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/content/main-tail.html");
let html = fs.readFileSync(filePath, "utf8");

const start = html.indexOf('<section id="sales-engineer"');
const end = html.indexOf('<section id="suggested-gx-products"');

if (start < 0 || end < 0) {
  throw new Error(
    "Could not find sales-engineer or suggested-gx-products markers"
  );
}

html = html.slice(0, start) + html.slice(end);
fs.writeFileSync(filePath, html);
console.log("Removed sales-engineer section from main-tail.html");
