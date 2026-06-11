/**
 * Generates footer markup strings + data/footer.ts from src/content/footer.html
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src/content/footer.html");
const OUT_MARKUP = path.join(ROOT, "src/components/layout/Footer/generated/markup.ts");
const OUT_DATA = path.join(ROOT, "src/data/footer.ts");

function normalizeHtml(html) {
  return html
    .replace(
      /https:\/\/(?:media|assets|cdn)\.vibemusic\.in(\/[^"'\\s)<]+)(\?[^"'\\s)]*)?/gi,
      (_, pathname) => `/images${pathname.split("?")[0]}`
    )
    .replace(/\sonclick="[^"]*"/gi, "")
    .replace(/ ref="[^"]*"/gi, "")
    .replace(/ value\s*\/>/gi, " />")
    .trim();
}

function escapeForTemplateLiteral(str) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function exportMarkup(name, html) {
  return `export const ${name} = \`${escapeForTemplateLiteral(html)}\`;\n`;
}

const html = normalizeHtml(fs.readFileSync(SRC, "utf8"));

const newGearStart = html.indexOf('<section class="assets-site-footer__newgearday-wrap');
const candyStart = html.indexOf('<section class="assets-site-footer-candy');
const navStart = html.indexOf("<nav>");
const socialStart = html.indexOf('<div class="assets-site-footer__contact-social-links"');
const helpStart = html.indexOf('<section class="assets-site-footer__help-links"');
const navEnd = html.indexOf("</nav>", helpStart);
const copyrightStart = html.indexOf('<section class="assets-site-footer__copyright"');

const footerOpen = html.slice(0, newGearStart);
const newGearDay = html.slice(newGearStart, candyStart);
const candy = html.slice(candyStart, navStart);
const contactMarkup = html.slice(navStart, socialStart);
const socialMarkup = html.slice(socialStart, helpStart);
const copyright = html.slice(copyrightStart);

const helpHtml = html.slice(helpStart, navEnd);
const categories = [
  ...helpHtml.matchAll(
    /<div class="assets-site-footer__help-links__category">([\s\S]*?)<\/div>/g
  ),
].map((m) => m[1]);

const columns = categories.map((catHtml) => {
  const headingLinks = [
    ...catHtml.matchAll(
      /<a href="([^"]*)" class="assets-site-footer__help-links__category-heading">([^<]*)</g
    ),
  ];
  const headingLink = headingLinks[0];
  const links = [
    ...catHtml.matchAll(/<a href="([^"]*)"[^>]*id="([^"]*)"[^>]*>([^<]*)</g),
  ].map((m) => ({
    href: m[1],
    id: m[2],
    label: m[3].replace(/&amp;/g, "&").trim(),
  }));
  return {
    heading: headingLink?.[2]?.trim() ?? "",
    headingHref: headingLink?.[1] ?? "#",
    links,
  };
});

const socials = [
  ...socialMarkup.matchAll(
    /<a href="([^"]*)" title="([^"]*)" aria-label="([^"]*)" target="([^"]*)" class="assets-site-footer__contact-social-link"/g
  ),
].map((m) => ({
  href: m[1],
  title: m[2],
  ariaLabel: m[3],
  target: m[4],
}));

const newGearImages = [
  ...newGearDay.matchAll(/src="([^"]+)"[^>]*alt="([^"]*)"/g),
].map((m) => ({ src: m[1], alt: m[2] }));

const dataFile = `/** Auto-generated from src/content/footer.html — run scripts/generate-footer.mjs */

export interface FooterLink {
  href: string;
  id: string;
  label: string;
}

export interface FooterColumn {
  heading: string;
  headingHref: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  href: string;
  title: string;
  ariaLabel: string;
  target: string;
}

export interface FooterNewGearImage {
  src: string;
  alt: string;
}

export const FOOTER_NEW_GEAR_IMAGES: FooterNewGearImage[] = ${JSON.stringify(newGearImages, null, 2)};

export const FOOTER_COLUMNS: FooterColumn[] = ${JSON.stringify(columns, null, 2)};

export const FOOTER_SOCIAL_LINKS: FooterSocialLink[] = ${JSON.stringify(socials, null, 2)};

export const FOOTER_NEWSLETTER = {
  heading: "Sign Up For Email Offers!",
  description: "Exclusive deals, delivered straight to your inbox.",
  action: "/publications/email/",
  placeholder: "Enter your email address",
  submitLabel: "Subscribe",
} as const;

export const FOOTER_COPYRIGHT = {
  brandName: "Vibe Music",
  brandHref: "/",
  locationLabel: "Mumbai, Maharashtra, India",
  locationHref:
    "https://www.google.com/maps/place/Vibe Music/@41.1240587,-85.2118876,16z/data=!4m6!3m5!1s0x8815e114fe320249:0xc771f8653d6ad5e6!8m2!3d41.124296!4d-85.2131735!16s%2Fg%2F1vg6vbkw?entry=ttu",
  directionsHref: "/local/directions",
  phoneHoursHref: "/about/contact#hours",
  storeHoursHref: "/about/contact#hours",
  phone: "+91-9876543210",
  phoneHref: "tel:+919876543210",
  year: 2026,
  tagline: "All rights reserved.",
} as const;

export const FOOTER_POLICIES = [
  { href: "/about/terms-of-use.php", label: "Terms of Use" },
  { href: "/privacy/", label: "Privacy Notice" },
  { href: "/glba/", label: "GLBA Notice" },
  { href: "/privacy/#phoneRecordingPolicy", label: "Phone Recording Policy" },
  { href: "/about/accessibility.php", label: "Accessibility" },
  { href: "/privacy/request/", label: "Do Not Sell Or Share My Personal Information" },
] as const;
`;

fs.mkdirSync(path.dirname(OUT_MARKUP), { recursive: true });

let markupFile = "// Auto-generated by scripts/generate-footer.mjs\n\n";
markupFile += exportMarkup("FOOTER_OPEN_MARKUP", footerOpen);
markupFile += exportMarkup("NEW_GEAR_DAY_MARKUP", newGearDay);
markupFile += exportMarkup("CANDY_MARKUP", candy);
markupFile += exportMarkup("CONTACT_MARKUP", contactMarkup);
markupFile += exportMarkup("SOCIAL_MARKUP", socialMarkup);
markupFile += exportMarkup("COPYRIGHT_MARKUP", copyright);

fs.writeFileSync(OUT_MARKUP, markupFile, "utf8");
fs.writeFileSync(OUT_DATA, dataFile, "utf8");

console.log("Wrote markup + data. columns:", columns.length, "socials:", socials.length);
