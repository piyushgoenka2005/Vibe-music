/**
 * Extracts typed navigation data from baseline header.html into headerNavigation.ts
 * Run: node scripts/extract-header-navigation.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/data/headerNavigation.ts");

let html;
try {
  html = execSync("git show 7ca3b47:src/content/header.html", {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
} catch {
  html = fs.readFileSync(
    path.join(ROOT, "scripts/_header_extract.html"),
    "utf8"
  );
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractAttr(tag, name) {
  const re = new RegExp(`${name}=["']([^"']*)["']`, "i");
  const m = tag.match(re);
  return m ? decodeEntities(m[1]) : undefined;
}

/** Parse top-level nav items inside .assets-site-header__nav-items */
function extractNavItems(html) {
  const navStart = html.indexOf('class="assets-site-header__nav-items"');
  if (navStart === -1) return [];
  const navBlock = html.slice(navStart, navStart + 320000);

  const items = [];
  const itemRe =
    /<div class="assets-site-header__nav-item([^"]*)"([^>]*id="([^"]+)")?[^>]*>([\s\S]*?)(?=<div class="assets-site-header__nav-item|<\/div>\s*<\/div>\s*<\/nav>)/g;

  let m;
  const simpleRe = /id="(mega-[^"]+)"/g;
  const ids = [...navBlock.matchAll(simpleRe)].map((x) => x[1]);

  for (const id of ids) {
    const idIdx = navBlock.indexOf(`id="${id}"`);
    if (idIdx === -1) continue;
    const chunk = navBlock.slice(idIdx, idIdx + 80000);
    const linkMatch = chunk.match(
      /<a href="([^"]*)"[^>]*class="assets-site-header__nav-link"[^>]*data-navigation="([^"]*)"[^>]*>([\s\S]*?)<\/a>/
    );
    if (!linkMatch) continue;

    const classes = chunk.match(/class="assets-site-header__nav-item([^"]*)"/)?.[1] ?? "";
    const panelMatch = chunk.match(
      /class="assets-site-header__nav-menu([^"]*)"([\s\S]*?)<\/div>\s*<\/div>\s*(?=<div class="assets-site-header__nav-item|$)/
    );

    items.push({
      id,
      href: linkMatch[1],
      label: linkMatch[2],
      className: `assets-site-header__nav-item${classes}`.trim(),
      panelClassName: panelMatch
        ? `assets-site-header__nav-menu${panelMatch[1]}`
        : undefined,
      panelHtmlLength: panelMatch ? panelMatch[2].length : 0,
    });
  }

  return items;
}

function extractMenuLinks(panelHtml) {
  const links = [];
  const linkRe =
    /<a href="([^"]*)"[^>]*class="([^"]*)"[^>]*(?:data-navigation="([^"]*)")?[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = linkRe.exec(panelHtml))) {
    const text = stripTags(m[4]);
    if (!text || text.length > 120) continue;
    links.push({
      href: m[1],
      className: m[2],
      navigation: m[3] ?? text,
      label: text,
    });
  }
  return links.slice(0, 500);
}

const navItems = extractNavItems(html);
const summary = navItems.map((item) => {
  const idIdx = html.indexOf(`id="${item.id}"`);
  const chunk = html.slice(idIdx, idIdx + 100000);
  const panelStart = chunk.indexOf("assets-site-header__nav-menu");
  let panelHtml = "";
  if (panelStart !== -1) {
    panelHtml = chunk.slice(panelStart, panelStart + 60000);
  }
  return {
    ...item,
    links: extractMenuLinks(panelHtml),
  };
});

const ts = `/** Auto-extracted from baseline header.html (7ca3b47). Regenerate: node scripts/extract-header-navigation.mjs */
import type { HeaderNavItem } from "@/types/header.types";

export const HEADER_NAV_ITEMS: HeaderNavItem[] = ${JSON.stringify(summary, null, 2)} as HeaderNavItem[];

export const HEADER_VERSION = "1780573205";
`;

fs.writeFileSync(OUT, ts, "utf8");
console.log("Wrote", OUT, "items:", summary.length);
summary.forEach((s) => console.log(s.id, s.label, "links:", s.links?.length ?? 0));
