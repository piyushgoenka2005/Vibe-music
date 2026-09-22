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

/**
 * Build "About this item" bullets from description content.
 * Falls back to sentence splitting for prose-only descriptions (common after bulk import).
 */
export function deriveAboutItems(description: string): ProductDetailsAboutItem[] {
  const blocks = parseProductDescription(description);
  const bulletBlocks = blocks.filter((block) => block.type === "bullet");
  const featureBlocks = blocks.filter((block) => block.type === "feature");

  if (bulletBlocks.length > 0) {
    return bulletBlocks.map((block) => ({ title: "", body: block.text }));
  }

  if (featureBlocks.length > 0) {
    return featureBlocks.map((block) => ({
      title: block.title,
      body: block.body,
    }));
  }

  const introBlocks = blocks.filter((block) => block.type === "intro");
  const proseSource =
    introBlocks
      .map((block) => block.text)
      .join(" ")
      .trim() || description.trim();

  return splitDescriptionSentences(proseSource).map((sentence) => ({
    title: "",
    body: sentence,
  }));
}
