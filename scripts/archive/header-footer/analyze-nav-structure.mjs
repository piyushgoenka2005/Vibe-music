import { execSync } from "child_process";

const h = execSync("git show 7ca3b47:src/content/header.html", {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
const mega = [...new Set([...h.matchAll(/id="(mega-[^"]+)"/g)].map((m) => m[1]))];
const navClasses = [
  ...new Set(
    [...h.matchAll(/class="(assets-site-header__nav-[a-z-]+)/g)].map((m) => m[1])
  ),
].sort();
console.log("mega ids:", mega);
console.log("nav classes sample:", navClasses.filter((c) => !c.includes("menu-item")).slice(0, 30));

const idx = h.indexOf('class="assets-site-header__nav-items"');
const block = h.slice(idx, idx + 5000);
console.log("\nnav-items start:\n", block.slice(0, 2000));
