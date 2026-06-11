import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/content/main-tail.html");
let html = fs.readFileSync(filePath, "utf8");

const start = html.indexOf('<section id="research-articles"');
const end = html.indexOf('<section id="careers"');

if (start < 0 || end < 0) {
  throw new Error("Could not find research-articles or careers markers");
}

html = html.slice(0, start) + html.slice(end);
fs.writeFileSync(filePath, html);
console.log("Removed research-articles section from main-tail.html");
