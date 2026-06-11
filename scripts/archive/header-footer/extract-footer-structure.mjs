import fs from "fs";

const h = fs.readFileSync("src/content/footer.html", "utf8");

const sections = [...h.matchAll(/<section class="([^"]+)"/g)].map((m) => m[1]);
console.log("sections:", sections);

const cols = [...h.matchAll(/class="assets-site-footer-col[^"]*"/g)];
console.log("cols", cols.length);

// column headings
const headings = [...h.matchAll(
  /class="assets-site-footer-col__heading"[^>]*>([^<]+)</g
)];
console.log("\nheadings:", headings.map((m) => m[1].trim()));

// subscribe area
const sub = h.indexOf("assets-site-footer-col--subscribe");
console.log("\nsubscribe snippet:", h.slice(sub, sub + 1200));

// social
const social = h.indexOf("assets-site-footer__social");
console.log("\nsocial idx", social);
if (social >= 0) console.log(h.slice(social, social + 1500));

// help links columns
const help = h.indexOf("assets-site-footer__help-links");
console.log("\nhelp idx", help);
if (help >= 0) console.log(h.slice(help, help + 2500));

// bottom copyright
const copy = h.indexOf("assets-site-footer__copyright");
console.log("\ncopyright idx", copy);
if (copy >= 0) console.log(h.slice(copy, copy + 2000));
