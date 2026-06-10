import fs from "fs";
import path from "path";
import { normalizeHtmlAssets } from "@/lib/mediaAssets";

interface HtmlChunkProps {
  name: string;
}

function readChunk(name: string) {
  const filePath = path.join(process.cwd(), "src", "content", `${name}.html`);
  return normalizeHtmlAssets(fs.readFileSync(filePath, "utf8").trim());
}

/** Renders a migration-time HTML fragment with display:contents (no layout wrapper). */
export default function HtmlChunk({ name }: HtmlChunkProps) {
  const html = readChunk(name);

  return (
    <div
      data-vibe-chunk={name}
      className="vibe-html-chunk"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
