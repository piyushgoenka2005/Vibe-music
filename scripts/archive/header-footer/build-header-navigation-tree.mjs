/**
 * Builds hierarchical headerNavigation.ts from baseline header.html
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const OUT = path.join(process.cwd(), "src/data/headerNavigation.ts");

const html = execSync("git show 7ca3b47:src/content/header.html", {
  encoding: "utf8",
  maxBuffer: 12 * 1024 * 1024,
});

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanLabel(raw) {
  let label = decode(raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  const broken = label.match(/^(.+?)"(?:\s+[^>]*?)?>\s*(.*)$/s);
  if (broken) {
    const left = broken[1].trim();
    const right = broken[2].trim();
    label = right || left;
  }
  return label
    .replace(/\\">/g, "")
    .replace(/">/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textContent(fragment) {
  return cleanLabel(fragment);
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (!link.label || link.label === "Main Menu") return false;
    if (link.label.includes("aria-description")) return false;
    if (link.href === "#" && !link.className) return false;
    const key = `${link.href}|${link.id ?? ""}|${link.navigation ?? link.label}|${link.className}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseLinks(fragment, limit = 800) {
  const links = [];
  const re =
    /<a\s+([^>]*?)href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(fragment)) && links.length < limit) {
    const attrs = m[1] + m[3];
    const className =
      attrs.match(/class="([^"]*)"/i)?.[1] ??
      attrs.match(/class='([^']*)'/i)?.[1] ??
      "";
    const id = attrs.match(/\bid="([^"]*)"/i)?.[1];
    const navigation = attrs.match(/data-navigation="([^"]*)"/i)?.[1];
    const testId = attrs.match(/data-testid="([^"]*)"/i)?.[1];
    const aria = attrs.match(/aria-description="([^"]*)"/i)?.[1];
    const label = textContent(m[4]);
    if (!label) continue;
    links.push({
      href: decode(m[2]),
      className,
      ...(id ? { id } : {}),
      ...(navigation ? { navigation: decode(navigation) } : {}),
      ...(testId ? { testId } : {}),
      ...(aria ? { ariaDescription: decode(aria) } : {}),
      label,
    });
  }
  return links;
}

function sliceNavSection() {
  const start = html.indexOf('<nav class="assets-site-header__nav"');
  if (start === -1) throw new Error("nav not found");
  let depth = 0;
  let i = start;
  while (i < html.length) {
    const open = html.indexOf("<nav", i);
    const close = html.indexOf("</nav>", i);
    if (close === -1) break;
    if (open !== -1 && open < close) {
      depth++;
      i = open + 4;
    } else {
      depth--;
      i = close + 6;
      if (depth === 0) return html.slice(start, i);
    }
  }
  return html.slice(start, start + 300000);
}

const navHtml = sliceNavSection();

/** Top-level nav item blocks */
function extractTopNavItems() {
  const items = [];
  const itemRe =
    /<div class="(assets-site-header__nav-item[^"]*)"([^>]*?)>([\s\S]*?)<\/div>\s*(?=<div class="assets-site-header__nav-item|<\/div>\s*<\/nav>)/g;

  // Simpler: split by nav-item opening
  const parts = navHtml.split(/<div class="assets-site-header__nav-item/);
  parts.shift();
  for (const part of parts) {
    const full = `<div class="assets-site-header__nav-item${part}`;
    const id = full.match(/\bid="([^"]+)"/)?.[1];
    const className =
      "assets-site-header__nav-item" +
      (full.match(/^assets-site-header__nav-item([^"]*)"/)?.[1] ?? "");
    const topLink = full.match(
      /<a href="([^"]*)"[^>]*class="assets-site-header__nav-link"[^>]*data-navigation="([^"]*)"[^>]*>/
    );
    if (!topLink) continue;
    const panelMatch = full.match(
      /<div class="(assets-site-header__nav-menu[^"]*)">([\s\S]*)$/
    );
    const panelClass = panelMatch?.[1];
    const panelBody = panelMatch?.[2] ?? "";
    items.push({
      id: id ?? `nav-${items.length}`,
      className: className.replace(/"\s.*/, "").trim(),
      href: decode(topLink[1]),
      label: decode(topLink[2]),
      panelClassName: panelClass,
      links: dedupeLinks(parseLinks(panelBody, 400)),
    });
  }
  return items;
}

const navItems = extractTopNavItems();

const ts = `/**
 * Navigation data extracted from baseline header.html (commit 7ca3b47).
 * Regenerate: node scripts/build-header-navigation-tree.mjs
 */
import type { HeaderNavItem } from "@/types/header.types";

export const HEADER_VERSION = "1780573205";

export const HEADER_NAV_ITEMS: HeaderNavItem[] = ${JSON.stringify(navItems, null, 2)} as HeaderNavItem[];
`;

fs.writeFileSync(OUT, ts, "utf8");
console.log("Wrote", OUT);
navItems.forEach((n) =>
  console.log("-", n.id, n.label, "links:", n.links.length)
);
