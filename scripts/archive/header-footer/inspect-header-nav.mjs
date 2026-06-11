import fs from "fs";

const html = fs.readFileSync("src/content/header.html", "utf8");

const dzStart = html.indexOf('class="assets-site-header__nav-menu-dz"');
console.log("DEALS MENU:", html.slice(dzStart, dzStart + 3500));

const catStart = html.indexOf('class="assets-site-header__nav-menu-category"');
console.log("\n\nCATEGORY MENU (first 2000):", html.slice(catStart, catStart + 2000));
