const fs = require("fs");
const path = require("path");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function stripHeaderFromPages() {
  const files = walk(path.join("src", "app"));
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    if (!content.includes('HtmlSection file="header"')) continue;

    const original = content;
    content = content.replace(/\s*<HtmlSection file="header" \/>\r?\n?/g, "\n");

    const stillUsesHtmlSection = /HtmlSection/.test(content);
    if (!stillUsesHtmlSection) {
      content = content.replace(
        /import HtmlSection from "@\/components\/sweetwater\/HtmlSection";\r?\n/,
        ""
      );
    }

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log("Updated:", file);
    }
  }
}

function stripHeroFromMain() {
  const mainPath = path.join("src", "content", "main.html");
  const main = fs.readFileSync(mainPath, "utf8");
  const lines = main.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    if (line.includes("sw-hero--triptych")) return false;
    if (line.includes("animate.min.css") && line.includes(".sw-hero{")) return false;
    return true;
  });
  fs.writeFileSync(mainPath, filtered.join("\n"));
  console.log("Stripped hero from main.html");
}

stripHeaderFromPages();
stripHeroFromMain();
