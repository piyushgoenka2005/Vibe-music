const fs = require("fs");
const h = fs.readFileSync("src/content/header.html", "utf8");
console.log("mega-sbc", h.indexOf('id="mega-sbc"'));
console.log("nav-items", h.indexOf("assets-site-header__nav-items"));
console.log("menu-nav-toggle", h.indexOf("menu-nav-toggle"));
const i = h.indexOf("assets-site-header__nav-items");
if (i >= 0) console.log(h.substring(i, i + 400));
