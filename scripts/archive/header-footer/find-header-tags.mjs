import fs from "fs";

const h = fs.readFileSync("src/content/header.html", "utf8");
const tags = ["header", "nav", "section"];
for (const tag of tags) {
  const open = [...h.matchAll(new RegExp(`<${tag}[\\s>]`, "gi"))].length;
  const close = [...h.matchAll(new RegExp(`</${tag}>`, "gi"))].length;
  console.log(tag, "open", open, "close", close);
}

const headerOpen = h.indexOf("<header");
const headerClose = h.indexOf("</header>");
console.log("header open", headerOpen, "close", headerClose);
console.log(h.slice(headerOpen, headerOpen + 200));

const navOpen = h.indexOf('<nav class="assets-site-header__nav"');
let depth = 0;
let navClose = -1;
for (let i = navOpen; i < h.length; i++) {
  if (h.startsWith("<nav", i)) depth++;
  if (h.startsWith("</nav>", i)) {
    depth--;
    if (depth === 0) {
      navClose = i + 6;
      break;
    }
  }
}
console.log("nav", navOpen, "navClose", navClose, "nav len", navClose - navOpen);
