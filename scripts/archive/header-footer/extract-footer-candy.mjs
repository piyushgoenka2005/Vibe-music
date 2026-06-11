import fs from "fs";

const h = fs.readFileSync("src/content/footer.html", "utf8");
const candyStart = h.indexOf('class="assets-site-footer-candy');
const candyEnd = h.indexOf('class="assets-site-footer__help-links');
const candy = h.slice(candyStart, candyEnd);
console.log("CANDY LENGTH", candy.length);
console.log(candy);

const help = h.slice(candyEnd, h.indexOf('class="assets-site-footer__copyright'));
console.log("\nHELP LENGTH", help.length);
console.log(help);
