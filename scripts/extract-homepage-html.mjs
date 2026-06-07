import fs from "fs";
import path from "path";

const sourcePath = path.join(process.cwd(), "homepage-source.html");
const html = fs.readFileSync(sourcePath, "utf8");

const adaStart = html.indexOf('<section id="assets-site-header__ada"');
const mainOpen = html.indexOf("<main>");
const mainClose = html.indexOf("</main>");
const footerStart = html.indexOf('<footer data-footer-version=');
const footerClose = html.indexOf("</footer>", footerStart);

if ([adaStart, mainOpen, mainClose, footerStart, footerClose].some((v) => v < 0)) {
  console.error({
    adaStart,
    mainOpen,
    mainClose,
    footerStart,
    footerClose,
  });
  throw new Error("Could not locate all sections");
}

const headerHtml = html
  .slice(adaStart, mainOpen)
  .replace(
    /<script\b[^>]*templates\/header\.js[^>]*>\s*<\/script>/gi,
    ""
  )
  .trim();
const mainHtml = html.slice(mainOpen, mainClose + "</main>".length).trim();
const footerHtml = html.slice(footerStart, footerClose + "</footer>".length).trim();

const outDir = path.join(process.cwd(), "src", "content");
fs.writeFileSync(path.join(outDir, "header.html"), headerHtml, "utf8");
fs.writeFileSync(path.join(outDir, "main.html"), mainHtml, "utf8");
fs.writeFileSync(path.join(outDir, "footer.html"), footerHtml, "utf8");

console.log("Wrote header.html", headerHtml.length);
console.log("Wrote main.html", mainHtml.length);
console.log("Wrote footer.html", footerHtml.length);
