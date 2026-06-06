const fs = require("fs");
const h = fs.readFileSync("sweatwater.html", "utf8");

function stripScripts(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

// Header includes ADA skip nav + full site header through primary nav
const headerStart = h.indexOf('<section id="assets-site-header__ada"');
const mainTagStart = h.indexOf("<main>");
// Keep full header markup through mobile search, login prompt, etc.
let headerHtml = h.substring(headerStart, mainTagStart);
headerHtml = stripScripts(headerHtml);

// Footer: start at <footer tag, not mid-attribute
const footerIdIdx = h.indexOf('id="assets-footer"');
const footerStart = h.lastIndexOf("<footer", footerIdIdx);

// Main: from <main> through closing </main>
const mainCloseIdx = h.indexOf("</main>", mainTagStart);
let mainHtml = h.substring(mainTagStart, mainCloseIdx + "</main>".length);
mainHtml = stripScripts(mainHtml);
// Remove trailing HTML comments inside main
mainHtml = mainHtml.replace(/<!---[\s\S]*?--->\s*$/g, "").trimEnd();

// Footer: from <footer> to </body>
let footerHtml = h.substring(footerStart, h.indexOf("</body>"));
footerHtml = stripScripts(footerHtml);

fs.writeFileSync("src/content/header.html", headerHtml);
fs.writeFileSync("src/content/main.html", mainHtml);
fs.writeFileSync("src/content/footer.html", footerHtml);

console.log("header", headerHtml.length);
console.log("main", mainHtml.length);
console.log("footer", footerHtml.length);
console.log("footer start:", footerHtml.substring(0, 80));
