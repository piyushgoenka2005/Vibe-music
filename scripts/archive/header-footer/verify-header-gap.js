const fs = require("fs");
const h = fs.readFileSync("homepage-source.html", "utf8");
const headerEnd = h.indexOf("<main>");
const chunk = h.substring(headerEnd - 5000, headerEnd);
console.log(chunk);
