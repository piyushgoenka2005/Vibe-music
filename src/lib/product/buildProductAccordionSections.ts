import { parseProductDescription } from "@/lib/product/formatProductDescription";
import type { ProductDetail } from "@/types/product";

export interface ProductAccordionSection {
  id: string;
  title: string;
  content: string[];
}

export function buildProductAccordionSections(
  product: ProductDetail
): ProductAccordionSection[] {
  const blocks = parseProductDescription(product.description);
  const introBlocks = blocks.filter((block) => block.type === "intro");
  const featureBlocks = blocks.filter((block) => block.type === "feature");
  const bulletBlocks = blocks.filter((block) => block.type === "bullet");

  const descriptionLines =
    bulletBlocks.length > 0
      ? bulletBlocks.map((block) => block.text)
      : introBlocks.length > 0
        ? introBlocks.map((block) => block.text)
        : product.description.trim()
          ? [product.description.trim()]
          : ["No description available for this product yet."];

  const whyBuyLines =
    featureBlocks.length > 0
      ? featureBlocks.map((block) =>
          block.body ? `${block.title} — ${block.body}` : block.title
        )
      : product.specs.slice(0, 4).map((spec) => `${spec.label}: ${spec.value}`);

  const ingredientLines =
    product.specs.length > 0
      ? product.specs.map((spec) => `${spec.label}: ${spec.value}`)
      : ["Specification details will be updated soon."];

  const howToUseLines =
    product.inTheBox.length > 0
      ? product.inTheBox
      : ["Refer to the included manual for setup and usage instructions."];

  return [
    { id: "description", title: "Description", content: descriptionLines },
    {
      id: "why-buy",
      title: "Why should you buy it?",
      content:
        whyBuyLines.length > 0
          ? whyBuyLines
          : ["Premium build quality and trusted brand support from Vibe Music."],
    },
    {
      id: "ingredients",
      title: "Ingredients",
      content: ingredientLines,
    },
    {
      id: "how-to-use",
      title: "How to use it?",
      content: howToUseLines,
    },
  ];
}
