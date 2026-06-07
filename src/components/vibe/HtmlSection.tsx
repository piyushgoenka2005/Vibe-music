import fs from "fs";
import path from "path";
import { normalizeHtmlAssets } from "@/lib/mediaAssets";

interface HtmlSectionProps {
  file: "header" | "main" | "footer";
}

function readHtml(file: string) {
  const filePath = path.join(process.cwd(), "src", "content", `${file}.html`);
  let html = fs.readFileSync(filePath, "utf8").trim();

  if (file === "header") {
    // Loaded post-hydration by HeaderInitializer to avoid body class mismatches.
    html = html.replace(
      /<script\b[^>]*templates\/header\.js[^>]*>\s*<\/script>/gi,
      ""
    );
  }

  return normalizeHtmlAssets(html);
}

export default function HtmlSection({ file }: HtmlSectionProps) {
  const html = readHtml(file);

  // Render without an extra wrapper div for footer/main/header since the
  // source HTML already contains the correct root semantic elements.
  // Using a single host element with suppressHydrationWarning avoids
  // hydration mismatches from browser extensions modifying injected HTML.
  return (
    <div
      data-vibe-section={file}
      className="vibe-html-section"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
