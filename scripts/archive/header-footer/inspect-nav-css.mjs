import fs from "fs";

const css = fs.readFileSync("public/vibe-inline.css", "utf8");

const matches = [...css.matchAll(/[^{}]*nav-menu-item[^{}]*nav-sub-menu[^{}]*\{[^}]*\}/gi)];
console.log("Rules linking menu-item to sub-menu:", matches.length);
matches.forEach((m) => console.log(m[0].slice(0, 400)));

const html = fs.readFileSync("src/content/header.html", "utf8");
for (const cls of ["mega-nav", "nav-dz", "nav-used", "nav-category", "assets-site-header__nav-deals"]) {
  console.log(`${cls}:`, html.includes(cls));
}

// deals structure
const dz = html.indexOf("nav-dz");
if (dz >= 0) console.log("\nDZ:", html.slice(dz - 50, dz + 800));
