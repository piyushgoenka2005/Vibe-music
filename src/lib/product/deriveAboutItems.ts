import { parseProductDescription } from "@/lib/product/formatProductDescription";
import type { ProductDetailsAboutItem } from "@/lib/product/buildProductDetailsViewModel";

function splitDescriptionSentences(text: string): string[] {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return [];

  const sentences =
    trimmed.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map((sentence) => sentence.trim()) ?? [];

  if (sentences.length > 0) return sentences;
  return [trimmed];
}

function normalizeAboutKey(item: ProductDetailsAboutItem): string {
  const combined = item.title ? `${item.title} ${item.body}`.trim() : item.body.trim();
  return combined.toLowerCase().replace(/\s+/g, " ");
}

function dedupeAboutItems(items: ProductDetailsAboutItem[]): ProductDetailsAboutItem[] {
  const seen = new Set<string>();
  const result: ProductDetailsAboutItem[] = [];

  for (const item of items) {
    const key = normalizeAboutKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

/**
 * Build "About this item" bullets from description content.
 * Falls back to sentence splitting for prose-only descriptions (common after bulk import).
 */
export function deriveAboutItems(description: string): ProductDetailsAboutItem[] {
  const blocks = parseProductDescription(description);
  const bulletBlocks = blocks.filter((block) => block.type === "bullet");
  const featureBlocks = blocks.filter((block) => block.type === "feature");
  const introBlocks = blocks.filter((block) => block.type === "intro");

  if (bulletBlocks.length > 0) {
    return dedupeAboutItems(bulletBlocks.map((block) => ({ title: "", body: block.text })));
  }

  const items: ProductDetailsAboutItem[] = [];

  for (const block of introBlocks) {
    items.push({ title: "", body: block.text });
  }

  for (const block of featureBlocks) {
    items.push({ title: block.title, body: block.body });
  }

  if (items.length > 0) {
    return dedupeAboutItems(items);
  }

  const proseSource = description.trim();
  return dedupeAboutItems(
    splitDescriptionSentences(proseSource).map((sentence) => ({
      title: "",
      body: sentence,
    })),
  );
}
