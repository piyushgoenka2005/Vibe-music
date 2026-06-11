import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/content/main-tail.html");
let html = fs.readFileSync(filePath, "utf8");

const start = html.indexOf('<section id="careers"');
if (start < 0) {
  throw new Error("Could not find careers section marker");
}

const end = html.indexOf("</section>", start);
if (end < 0) {
  throw new Error("Could not find careers section closing tag");
}

html = html.slice(0, start) + html.slice(end + "</section>".length);
fs.writeFileSync(filePath, html);
console.log("Removed careers section from main-tail.html");
