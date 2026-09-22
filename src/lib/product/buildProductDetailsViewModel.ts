import { deriveAboutItems } from "@/lib/product/deriveAboutItems";
import { enrichProductSpecs } from "@/lib/product/enrichProductSpecs";
import { parseProductDescription } from "@/lib/product/formatProductDescription";
import {
  getMaterialAndCareSpecs,
  getQuickPreviewSpecs,
  getSizeAndFitSpecs,
  getStyleSpec,
  groupProductSpecs,
  normalizeSpecLabel,
  type ProductSpecGroup,
} from "@/lib/product/groupProductSpecs";
import type { ProductDetail, ProductSpec } from "@/types/product";

export interface ProductDetailsAboutItem {
  title: string;
  body: string;
}

export interface ProductDetailsViewModel {
  introBlocks: Array<{ text: string }>;
  aboutItems: ProductDetailsAboutItem[];
  styleSpec: ProductSpec | null;
  sizeAndFitSpecs: ProductSpec[];
  materialAndCareSpecs: ProductSpec[];
  quickSpecs: ProductSpec[];
  completeSpecs: ProductSpec[];
  expandedGroups: ProductSpecGroup[];
  inTheBox: string[];
  hasExpandedContent: boolean;
  hasAnyContent: boolean;
}

function filterGroupsExcludingLabels(
  groups: ProductSpecGroup[],
  excluded: Set<string>,
): ProductSpecGroup[] {
  return groups
    .map((group) => ({
      ...group,
      specs: group.specs.filter((spec) => !excluded.has(normalizeSpecLabel(spec.label))),
    }))
    .filter((group) => group.specs.length > 0);
}

function excludeStyleFromQuickSpecs(
  quickSpecs: ProductSpec[],
  styleSpec: ProductSpec | null,
): ProductSpec[] {
  if (!styleSpec) return quickSpecs;
  const styleKey = normalizeSpecLabel(styleSpec.label);
  return quickSpecs.filter((spec) => normalizeSpecLabel(spec.label) !== styleKey);
}

export function buildProductDetailsViewModel(product: ProductDetail): ProductDetailsViewModel {
  const enrichedSpecs = enrichProductSpecs(product);

  const descriptionBlocks = parseProductDescription(product.description);
  const introBlocks = descriptionBlocks
    .filter((block) => block.type === "intro")
    .map((block) => ({ text: block.text }));

  const aboutItems = deriveAboutItems(product.description);

  const styleSpec = getStyleSpec(enrichedSpecs) ?? null;
  const sizeAndFitSpecs = getSizeAndFitSpecs(enrichedSpecs);
  const materialAndCareSpecs = getMaterialAndCareSpecs(enrichedSpecs);
  const quickSpecs = excludeStyleFromQuickSpecs(
    getQuickPreviewSpecs(enrichedSpecs, product.brand),
    styleSpec,
  );

  const subsectionExclusions = new Set<string>([
    ...sizeAndFitSpecs.map((spec) => normalizeSpecLabel(spec.label)),
    ...materialAndCareSpecs.map((spec) => normalizeSpecLabel(spec.label)),
    ...(styleSpec ? [normalizeSpecLabel(styleSpec.label)] : []),
  ]);

  const expandedGroups = filterGroupsExcludingLabels(
    groupProductSpecs(enrichedSpecs),
    subsectionExclusions,
  );

  const inTheBox = product.inTheBox.filter((item) => item.trim().length > 0);
  const hasExpandedContent =
    expandedGroups.length > 0 || inTheBox.length > 0 || enrichedSpecs.length > 0;
  const hasAnyContent =
    introBlocks.length > 0 ||
    aboutItems.length > 0 ||
    quickSpecs.length > 0 ||
    sizeAndFitSpecs.length > 0 ||
    materialAndCareSpecs.length > 0 ||
    styleSpec !== null ||
    hasExpandedContent;

  return {
    introBlocks,
    aboutItems,
    styleSpec,
    sizeAndFitSpecs,
    materialAndCareSpecs,
    quickSpecs,
    completeSpecs: enrichedSpecs,
    expandedGroups,
    inTheBox,
    hasExpandedContent,
    hasAnyContent,
  };
}
