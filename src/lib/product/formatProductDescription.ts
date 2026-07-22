export type DescriptionBlock =
  | { type: "intro"; text: string }
  | { type: "feature"; title: string; body: string }
  | { type: "bullet"; text: string };

function stripBulletMarker(line: string): string {
  return line.trim().replace(/^[-•*]\s+/, "");
}

/** Admin editor ↔ stored description (one bullet per line). */
export function descriptionToBulletLines(description: string): string[] {
  const trimmed = description.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return [""];
  const lines = trimmed
    .split("\n")
    .map(stripBulletMarker)
    .filter(Boolean);
  return lines.length > 0 ? [...lines, ""] : [""];
}

export function bulletLinesToDescription(lines: string[]): string {
  return lines.map((line) => line.trim()).filter(Boolean).join("\n");
}

function parseBulletListDescription(normalized: string): DescriptionBlock[] | null {
  if (/\n\n/.test(normalized)) return null;

  const rawLines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  if (rawLines.length === 0) return null;

  if (rawLines.length === 1) {
    const line = rawLines[0]!;
    if (/^[-•*]\s+/.test(line)) {
      return [{ type: "bullet", text: stripBulletMarker(line) }];
    }
    return null;
  }

  return rawLines.map((line) => ({
    type: "bullet" as const,
    text: stripBulletMarker(line),
  }));
}

const BODY_STARTERS = new Set([
  "built-in",
  "suitable",
  "compatible",
  "strong",
  "ideal",
  "designed",
  "engineered",
  "offers",
  "includes",
  "features",
  "provides",
  "delivers",
  "ensures",
  "allows",
  "supports",
  "made",
  "crafted",
  "equipped",
]);

const TITLE_END_NOUNS = new Set([
  "output",
  "processing",
  "applications",
  "usage",
  "design",
  "performance",
  "technology",
  "control",
  "system",
  "quality",
  "features",
  "clarity",
  "connectivity",
  "construction",
]);

const CONNECTORS = new Set(["for", "and", "with", "&", "the", "a", "an", "of", "in", "to"]);

function normalizeInlineDescription(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/ {2,}/g, " ")
    .trim();
}

function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  return true;
}

function isTitleCaseWord(word: string): boolean {
  if (CONNECTORS.has(word.toLowerCase())) return true;
  if (/^[A-Z][a-z]/.test(word)) return true;
  if (/^[A-Z]{2,}$/.test(word)) return true;
  if (/^[A-Z][a-z]+-[A-Z][a-z]+/.test(word)) return true;
  return false;
}

function splitTitleBody(chunk: string): { title: string; body: string } {
  const words = chunk.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    return { title: chunk.trim(), body: "" };
  }

  let splitIndex = words.length;
  for (let i = 3; i < Math.min(words.length, 10); i += 1) {
    const word = words[i];
    const prev = words[i - 1]?.toLowerCase() ?? "";

    if (word.startsWith("Built-")) {
      splitIndex = i;
      break;
    }

    if (BODY_STARTERS.has(word.toLowerCase())) {
      if (word.toLowerCase() === "features" && /^Features?$/.test(word)) {
        continue;
      }
      splitIndex = i;
      break;
    }

    if (TITLE_END_NOUNS.has(prev) && /^[A-Z]/.test(word) && !isTitleCaseWord(word)) {
      splitIndex = i;
      break;
    }

    if (TITLE_END_NOUNS.has(prev) && /^[A-Z]{2,}/.test(word)) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex >= words.length) {
    for (let i = 3; i < words.length; i += 1) {
      if (!isTitleCaseWord(words[i])) {
        splitIndex = i;
        break;
      }
    }
  }

  return cleanFeatureTitle(
    words.slice(0, splitIndex).join(" "),
    words.slice(splitIndex).join(" ")
  );
}

function cleanFeatureTitle(title: string, body: string): { title: string; body: string } {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return { title: trimmedTitle, body: trimmedBody };
  }

  const brandSuffix = trimmedTitle.match(/^(.+?)\s+(ADEON\s+[A-Z0-9][A-Z0-9\-]*)$/i);
  if (brandSuffix) {
    return {
      title: brandSuffix[1].trim(),
      body: `${brandSuffix[2]} ${trimmedBody}`,
    };
  }

  return { title: trimmedTitle, body: trimmedBody };
}

function findFirstFeatureIndex(text: string): number {
  const marker =
    /\.\s+(?:[A-Z][A-Za-z0-9\-]+(?: (?:& |for |and |with |[A-Z][A-Za-z0-9\-]+)){2,6})\s+(?:Built-in|ADEON|Suitable|Compatible|Strong|[A-Z]{2,})/;
  const match = marker.exec(text);
  return match ? match.index + 2 : -1;
}

function splitFeatureChunks(featureText: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  for (let index = 0; index < featureText.length - 1; index += 1) {
    if (featureText[index] !== "." || featureText[index + 1] !== " ") continue;

    const candidate = featureText.slice(index + 2).trimStart();
    const split = splitTitleBody(candidate);
    const titleWords = split.title.split(/\s+/).filter(Boolean);

    if (titleWords.length < 2 || titleWords.length > 10) continue;
    if (!split.body || split.body.length < 12) continue;

    const chunk = featureText.slice(start, index + 1).trim();
    if (chunk) chunks.push(chunk);
    start = index + 2;
  }

  const tail = featureText.slice(start).trim();
  if (tail) chunks.push(tail);

  return chunks.length > 0 ? chunks : [featureText.trim()];
}

function splitIntroParagraphs(intro: string): string[] {
  const trimmed = intro.trim();
  if (!trimmed) return [];

  const sentences =
    trimmed.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map((sentence) => sentence.trim()) ?? [trimmed];

  if (sentences.length <= 2) {
    return [trimmed];
  }

  const midpoint = Math.min(2, Math.ceil(sentences.length / 2));
  const paragraphs = [sentences.slice(0, midpoint).join(" ")];
  const remainder = sentences.slice(midpoint).join(" ").trim();

  if (remainder) {
    paragraphs.push(remainder);
  }

  return paragraphs;
}

function parseInlineDescription(text: string): {
  introParagraphs: string[];
  features: Array<{ title: string; body: string }>;
} {
  const normalized = normalizeInlineDescription(text);
  const featureStart = findFirstFeatureIndex(normalized);
  if (featureStart === -1) {
    return { introParagraphs: splitIntroParagraphs(normalized), features: [] };
  }

  const intro = normalized.slice(0, featureStart).trim();
  const featureText = normalized.slice(featureStart).trim();
  const features = splitFeatureChunks(featureText)
    .map(splitTitleBody)
    .filter((feature) => feature.title.length > 0);

  return {
    introParagraphs: splitIntroParagraphs(intro),
    features,
  };
}

function parseStructuredSections(normalized: string): DescriptionBlock[] {
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

    const prose = normalizeInlineDescription(section.replace(/\n+/g, " "));
    const inline = parseInlineDescription(prose);

    if (inline.features.length > 0) {
      for (const paragraph of inline.introParagraphs) {
        blocks.push({ type: "intro", text: paragraph });
      }
      for (const feature of inline.features) {
        blocks.push({ type: "feature", title: feature.title, body: feature.body });
      }
      continue;
    }

    for (const paragraph of splitIntroParagraphs(prose)) {
      blocks.push({ type: "intro", text: paragraph });
    }
  }

  return blocks;
}

export function parseProductDescription(description: string): DescriptionBlock[] {
  const normalized = description.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const bulletBlocks = parseBulletListDescription(normalized);
  if (bulletBlocks) return bulletBlocks;

  if (/\n\n/.test(normalized)) {
    return parseStructuredSections(normalized);
  }

  const inline = parseInlineDescription(normalized.replace(/\n+/g, " "));
  if (inline.features.length > 0) {
    return [
      ...inline.introParagraphs.map((text) => ({ type: "intro" as const, text })),
      ...inline.features.map((feature) => ({
        type: "feature" as const,
        title: feature.title,
        body: feature.body,
      })),
    ];
  }

  return splitIntroParagraphs(normalized).map((text) => ({ type: "intro" as const, text }));
}
