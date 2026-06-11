const fs = require("fs");
const h = fs.readFileSync("homepage-source.html", "utf8");

function stripScripts(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

// Find footer opening tag properly
const footerIdIdx = h.indexOf('id="assets-footer"');
const footerStart = h.lastIndexOf("<footer", footerIdIdx);
console.log("footer tag starts at:", footerStart);
console.log("context:", h.substring(footerStart, footerStart + 120));

let footerHtml = h.substring(footerStart, h.indexOf("</body>"));
footerHtml = stripScripts(footerHtml);
// Remove noscript and trailing junk after </footer> if needed - keep aside and visually-hidden as in source

fs.writeFileSync("src/content/footer.html", footerHtml);
console.log("footer length:", footerHtml.length);
console.log("footer starts with:", footerHtml.substring(0, 80));

// Also verify header and main don't have similar issues
const headerStart = h.indexOf('<section id="assets-site-header__ada"');
const mainTagStart = h.indexOf("<main>");
let headerHtml = h.substring(headerStart, mainTagStart);
headerHtml = stripScripts(headerHtml);
const lastNavClose = headerHtml.lastIndexOf("</nav>");
if (lastNavClose > 0) {
  headerHtml = headerHtml.substring(0, lastNavClose + 6) + "\n</div>";
}
console.log("header starts:", headerHtml.substring(0, 60));

const footerInMain = h.indexOf('id="assets-footer"');
let mainHtml = h.substring(mainTagStart, footerStart);
mainHtml = stripScripts(mainHtml);
fs.writeFileSync("src/content/header.html", headerHtml);
fs.writeFileSync("src/content/main.html", mainHtml);
console.log("main ends:", mainHtml.substring(mainHtml.length - 100));
