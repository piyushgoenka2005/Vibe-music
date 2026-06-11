import { execSync } from "child_process";
import fs from "fs";

const html = execSync("git show 7ca3b47:src/content/header.html", {
  encoding: "utf8",
  maxBuffer: 12 * 1024 * 1024,
});

function cleanLabel(raw) {
  let label = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\\">/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  const broken = label.match(/^(.+?)"(?:\s+[^>]*?)?>\s*(.*)$/s);
  if (broken) {
    const left = broken[1].trim();
    const right = broken[2].trim();
    label = right || left;
  }
  return label.replace(/">/g, " ").replace(/\s+/g, " ").trim();
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (!link.label) return false;
    const key = `${link.href}|${link.navigation ?? link.label}|${link.className}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const start = html.indexOf('id="mega-sbc"');
const chunk = html.slice(start, start + 280000);

const categories = [];
const itemRe =
  /<div class="assets-site-header__nav-menu-item mn-top-level">([\s\S]*?)(?=<div class="assets-site-header__nav-menu-item mn-top-level">|<div class="assets-site-header__nav-drop-row">|$)/g;

let m;
while ((m = itemRe.exec(chunk))) {
  const block = m[1];
  const top = block.match(
    /<a href="([^"]*)"[^>]*class="assets-site-header__nav-menu-item-link"[^>]*data-navigation="([^"]*)"[^>]*>([\s\S]*?)<\/a>/
  );
  if (!top) continue;
  const label = cleanLabel(top[3]);
  const subLinks = [];
  const subRe =
    /<a href="([^"]*)"[^>]*class="([^"]*)"[^>]*(?:data-navigation="([^"]*)")?[^>]*>([\s\S]*?)<\/a>/g;
  let s;
  while ((s = subRe.exec(block))) {
    const linkLabel = cleanLabel(s[4]);
    if (!linkLabel || linkLabel === label) continue;
    if (linkLabel.includes("aria-description")) continue;
    subLinks.push({
      href: s[1],
      className: s[2].trim(),
      navigation: cleanLabel(s[3] ?? linkLabel),
      label: linkLabel,
    });
  }
  categories.push({
    href: top[1],
    navigation: cleanLabel(top[2]),
    label,
    links: dedupeLinks(subLinks).slice(0, 80),
  });
}

const out = `import type { MegaMenuCategory } from "@/types/header.types";

export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = ${JSON.stringify(categories, null, 2)} as MegaMenuCategory[];
`;
fs.writeFileSync("src/data/megaMenuCategories.ts", out);
console.log("categories", categories.length);
