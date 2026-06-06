import fs from "fs";
import path from "path";

interface HtmlSectionProps {
  file: "header" | "main" | "footer";
}

function readHtml(file: string) {
  const filePath = path.join(process.cwd(), "src", "content", `${file}.html`);
  return fs.readFileSync(filePath, "utf8").trim();
}

export default function HtmlSection({ file }: HtmlSectionProps) {
  const html = readHtml(file);

  // Render without an extra wrapper div for footer/main/header since the
  // source HTML already contains the correct root semantic elements.
  // Using a single host element with suppressHydrationWarning avoids
  // hydration mismatches from browser extensions modifying injected HTML.
  return (
    <div
      data-sweetwater-section={file}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
