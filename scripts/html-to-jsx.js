const fs = require("fs");
const path = require("path");

function stripScripts(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/ style="[^"]*"/gi, (m) => {
      // keep style for black-bar
      if (m.includes("background-color") || m.includes("display: none")) return m;
      return "";
    });
}

function htmlToJsx(html) {
  let jsx = stripScripts(html);
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, "");
  jsx = jsx.replace(/\bclass=/g, "className=");
  jsx = jsx.replace(/\bfor=/g, "htmlFor=");
  jsx = jsx.replace(/\btabindex=/g, "tabIndex=");
  jsx = jsx.replace(/\breadonly\b/g, "readOnly");
  jsx = jsx.replace(/\bautocomplete=/g, "autoComplete=");
  jsx = jsx.replace(/\bautocorrect=/g, "autoCorrect=");
  jsx = jsx.replace(/\bautocapitalize=/g, "autoCapitalize=");
  jsx = jsx.replace(/\bspellcheck=/g, "spellCheck=");
  jsx = jsx.replace(/\bmaxlength=/g, "maxLength=");
  jsx = jsx.replace(/\bminlength=/g, "minLength=");
  jsx = jsx.replace(/\benterkeyhint=/g, "enterKeyHint=");
  jsx = jsx.replace(/\baria-hidden=/g, "aria-hidden=");
  jsx = jsx.replace(/\baria-label=/g, "aria-label=");
  jsx = jsx.replace(/\baria-labelledby=/g, "aria-labelledby=");
  jsx = jsx.replace(/\baria-description=/g, "aria-description=");
  jsx = jsx.replace(/\baria-pressed=/g, "aria-pressed=");
  jsx = jsx.replace(/\baria-modal=/g, "aria-modal=");
  jsx = jsx.replace(/\baria-live=/g, "aria-live=");
  jsx = jsx.replace(/\bviewBox=/g, "viewBox=");
  jsx = jsx.replace(/\bstroke-width=/g, "strokeWidth=");
  jsx = jsx.replace(/\bstroke-linecap=/g, "strokeLinecap=");
  jsx = jsx.replace(/\bstroke-linejoin=/g, "strokeLinejoin=");
  jsx = jsx.replace(/\bfill-rule=/g, "fillRule=");
  jsx = jsx.replace(/\bclip-path=/g, "clipPath=");
  jsx = jsx.replace(/\bclip-rule=/g, "clipRule=");
  jsx = jsx.replace(/\bxml:space=/g, "xmlSpace=");
  jsx = jsx.replace(/\bxmlns:xlink=/g, "xmlnsXlink=");
  jsx = jsx.replace(/\bcolspan=/g, "colSpan=");
  jsx = jsx.replace(/\browspan=/g, "rowSpan=");
  jsx = jsx.replace(/\bsrcset=/g, "srcSet=");
  jsx = jsx.replace(/\bnovalidate\b/g, "noValidate");
  jsx = jsx.replace(/\bdisabled\b/g, "disabled");
  jsx = jsx.replace(/\bhidden\b/g, "hidden");
  jsx = jsx.replace(/\bselected\b/g, "selected");
  jsx = jsx.replace(/\bchecked\b/g, "checked");
  jsx = jsx.replace(/\bmultiple\b/g, "multiple");
  jsx = jsx.replace(/\brequired\b/g, "required");
  // self-close void elements
  jsx = jsx.replace(/<(img|input|br|hr|meta|link|source|area|base|col|embed|param|track|wbr)([^>]*?)>/gi, "<$1$2 />");
  jsx = jsx.replace(/<(img|input|br|hr|meta|link|source|area|base|col|embed|param|track|wbr)([^>]*?)(?<!\/)>/gi, "<$1$2 />");
  return jsx.trim();
}

function wrapComponent(name, jsx) {
  return `/* Auto-converted from homepage-source.html - preserve exact DOM structure */\nexport default function ${name}() {\n  return (\n    <>\n${jsx
    .split("\n")
    .map((l) => "      " + l)
    .join("\n")}\n    </>\n  );\n}\n`;
}

const sections = [
  ["section-personalization.html", "PersonalizationWidgets", "PersonalizationWidgets"],
  ["section-popular-categories.html", "PopularCategories", "PopularCategories"],
  ["section-hero-tiles.html", "HeroTiles", "HeroTiles"],
  ["section-value-ads.html", "ValueAdds", "ValueAdds"],
  ["section-topnew-products.html", "TopNewProducts", "TopNewProducts"],
  ["section-score-gear.html", "ScoreGear", "ScoreGear"],
  ["section-suggested-gx.html", "SuggestedGxProducts", "SuggestedGxProducts"],
  ["section-careers.html", "HomepageCareers", "HomepageCareers"],
];

const outDir = path.join("src", "components", "sweetwater");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const [file, componentName] of sections) {
  const raw = fs.readFileSync(path.join("scripts", file), "utf8");
  const jsx = htmlToJsx(raw);
  fs.writeFileSync(
    path.join(outDir, `${componentName}.tsx`),
    wrapComponent(componentName, jsx)
  );
  console.log(`Generated ${componentName}.tsx`);
}

// Extract inline CSS from HTML
const html = fs.readFileSync("homepage-source.html", "utf8");
const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
let inlineCss = "";
for (const m of styleBlocks) inlineCss += m[1] + "\n";
fs.writeFileSync(path.join("src", "styles", "vibe-inline.css"), inlineCss.substring(0, 800000));
console.log("Wrote vibe-inline.css", inlineCss.length);
