export type DescriptionBlock =
  | { type: "intro"; text: string }
  | { type: "feature"; title: string; body: string };

function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  return true;
}

export function parseProductDescription(description: string): DescriptionBlock[] {
  const normalized = description.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const sections = normalized.split(/\n\n+/).map((section) => section.trim()).filter(Boolean);
  const blocks: DescriptionBlock[] = [];

  for (const section of sections) {
    const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);

    if (lines.length >= 2 && looksLikeHeading(lines[0])) {
      blocks.push({
        type: "feature",
        title: lines[0],
        body: lines.slice(1).join(" "),
      });
      continue;
    }

    blocks.push({
      type: "intro",
      text: section.replace(/\n+/g, " "),
    });
  }

  return blocks;
}
